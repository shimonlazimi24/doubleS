import type { SupabaseClient } from "@supabase/supabase-js";
import { runStructuredAi, streamOpenAiJsonResponse } from "../create-ai-client";
import { lessonChatPrompt, lessonChatSystemPrompt } from "../prompts";
import {
  type RetrievedChunk,
  type AiUserStatsSnapshot,
  buildVectorQueryText,
  isBankTopicSlug,
  loadAiQuizSnapshot,
  loadAiUserStatsSnapshot,
  retrieveForLessonChat,
} from "../retrieval";
import { runEmbedding } from "../openai-client";
import { normalizeModelLineBreaks } from "../model-text";
import { normalizeChunkReferences } from "../reference-utils";
import { redactPersonalData, screenLearnerMessage, validateAiGroundedNumericClaims } from "../safety";
import { logAiSafetyValidationFailure } from "../ai-usage";
import type { AiRequestLogContext } from "../ai-request-context";
import { getModuleByLessonId } from "../../navigation";
import { getBankQuestion } from "../../question-bank";
import * as examFacts from "../../exam-facts";
import { classifyChatIntent, extractEnglishWordForVocab, inferQuestionTypeHeuristic, resolveStagedStage } from "./intent-classifier";
import { logisticsModePrompt } from "./logistics-answer";
import { buildPerformanceCoachCopy, loadPerformanceCoachInputs } from "./performance-coach";
import { stagedHintModePrompt } from "./staged-hints";
import {
  amirantChatbotAiResponseSchema,
  amirantChatbotRequestSchema,
  amirantChatbotResponseSchema,
  type AmirantChatbotRequest,
  type AmirantChatbotResponse,
} from "./schemas";
import { formatVocabLookupReply, suggestRelatedWords } from "./vocabulary-tools";
import type { AmirantChatbotAiResponse, AmirantQuestionType } from "./schemas";
import {
  buildLearnerProfileText,
  isRevealBlocked,
  resolveActiveContextForPrompt,
  shouldUseStagedHelp,
  REVEAL_BLOCKED_ANSWER_HE,
} from "./chat-context";

const EMPTY_USER_STATS: AiUserStatsSnapshot = { topicRollups: [], adaptiveState: [] };

function mapQuestionType(raw?: string | null): AmirantQuestionType | "unknown" {
  if (!raw) return "unknown";
  const s = raw.trim().toLowerCase();
  if (
    s === "sentence_completion" ||
    s === "rephrasing" ||
    s === "reading_comprehension" ||
    s === "vocabulary" ||
    s === "simulation" ||
    s === "general_lesson"
  ) {
    return s;
  }
  return "unknown";
}

function deterministicReply(params: {
  intent: AmirantChatbotResponse["intent"];
  answer: string;
  questionType?: AmirantQuestionType | "unknown";
  recommendedAction?: string | null;
  safeFallback?: boolean;
}): AmirantChatbotResponse {
  return amirantChatbotResponseSchema.parse({
    intent: params.intent,
    answer: params.answer,
    questionType: params.questionType ?? "unknown",
    hintStage: null,
    nextHintAvailable: false,
    recommendedAction: params.recommendedAction ?? null,
    references: [],
    referencedChunks: [],
    usedStudentData: false,
    safeFallback: params.safeFallback ?? true,
  });
}

function mergeResponse(
  ai: {
    answer: string;
    intent: AmirantChatbotResponse["intent"];
    questionType?: AmirantQuestionType | "unknown" | null;
    hintStage?: number | null;
    nextHintAvailable?: boolean;
    recommendedAction?: string | null;
    usedStudentData?: boolean;
    safeFallback?: boolean;
    references: { chunkId: string; lessonId?: string; topic?: string }[];
  },
  chunks: RetrievedChunk[],
): AmirantChatbotResponse {
  const references = normalizeChunkReferences(ai.references, chunks);
  return amirantChatbotResponseSchema.parse({
    ...ai,
    references,
    referencedChunks: references,
  });
}

/** Context line for the prompt: chunk id, relevance, and the lesson's human title when known. */
function formatContextLine(chunk: RetrievedChunk): string {
  const sim = chunk.similarity != null ? `|sim:${Number(chunk.similarity).toFixed(3)}` : "";
  const title = chunk.lessonId ? getModuleByLessonId(chunk.lessonId)?.lesson.title : undefined;
  const lesson = title ? `|lesson:«${title}»` : chunk.topic ? `|topic:${chunk.topic}` : "";
  return `[chunk:${chunk.id}${sim}${lesson}] ${chunk.text}`;
}

/** Strips personal data from everything the learner typed before it reaches the model or the log. */
export function redactChatRequest(request: AmirantChatbotRequest): AmirantChatbotRequest {
  return {
    ...request,
    userMessage: redactPersonalData(request.userMessage),
    history: request.history?.map((h) => ({ ...h, text: redactPersonalData(h.text) })),
  };
}

export async function runAmirantChatbot(
  /** `null` only in local dev without Supabase: the request runs as a guest without RAG. */
  client: SupabaseClient | null,
  userId: string | null,
  raw: unknown,
  logCtx?: AiRequestLogContext,
  /** Optional streaming callback - receives answer tokens as they arrive (OpenAI streaming path only). */
  onToken?: (delta: string) => void,
): Promise<AmirantChatbotResponse> {
  const request = redactChatRequest(amirantChatbotRequestSchema.parse(raw) as AmirantChatbotRequest);
  const { intent, explicitReveal } = classifyChatIntent(request);

  // Role-override attempts get a fixed Hebrew reply; no model call, no log noise.
  const screen = screenLearnerMessage(request.userMessage);
  if (!screen.ok) {
    return deterministicReply({ intent: "general_course_help", answer: screen.answerHe });
  }

  const active = request.activeContext;
  const questionTypeFromClient = mapQuestionType(request.stagedHintContext?.questionType ?? active?.questionType);
  const questionTypeInferred = inferQuestionTypeHeuristic(request.userMessage);
  const questionType: AmirantQuestionType | "unknown" =
    questionTypeFromClient !== "unknown" ? questionTypeFromClient : questionTypeInferred;

  const { stage, isNext } = resolveStagedStage(request, intent);
  const wantsReveal = explicitReveal || intent === "reveal_answer" || stage >= 4;

  // Timed unit, learner has not chosen: the key is withheld on the server and no model call is made.
  if (wantsReveal && isRevealBlocked(active)) {
    return deterministicReply({
      intent: "reveal_answer",
      answer: REVEAL_BLOCKED_ANSWER_HE,
      questionType,
      safeFallback: false,
    });
  }

  // Only real bank topic slugs are retrieval filters; a lesson step label is not.
  const topicFilter = isBankTopicSlug(request.topic) ? request.topic : active?.questionType && isBankTopicSlug(active.questionType) ? active.questionType : undefined;

  const lessonEntry = request.lessonId ? getModuleByLessonId(request.lessonId) : undefined;
  const lessonTitle = lessonEntry?.lesson.title;
  const moduleTitle = lessonEntry?.module.title;

  const questionContext = [
    lessonTitle ? `Lesson: ${lessonTitle}` : "",
    moduleTitle ? `Module: ${moduleTitle}` : "",
    topicFilter ? `Topic: ${topicFilter}` : "",
    // The on-screen sentence/question is the best retrieval anchor for "what about this one?"
    active?.text ? active.text.slice(0, 400) : request.activeQuestionText?.slice(0, 400) ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  // Short follow-ups ("לא הבנתי", "ומה לגבי...") lean on the previous turn - add it to the query.
  const lastUserTurn = request.history?.filter((h) => h.role === "user").slice(-1)[0]?.text ?? "";
  const retrievalQuery =
    request.userMessage.length < 60 && lastUserTurn ? `${lastUserTurn}\n${request.userMessage}` : request.userMessage;

  const vectorText = buildVectorQueryText({ query: retrievalQuery, questionContext });

  if (intent === "vocabulary_lookup" || (request.clientAction === "vocab_lookup" && request.vocabularyWord)) {
    const w =
      (request.vocabularyWord?.trim() && request.vocabularyWord.toLowerCase()) ||
      extractEnglishWordForVocab(request.userMessage, request.vocabularyWord) ||
      null;
    if (!w) {
      return deterministicReply({
        intent: "vocabulary_lookup",
        answer: "איזו מילה באנגלית לבדוק? כתבו אותה, למשל: בדוק מילה: reluctant.",
        questionType: "vocabulary",
      });
    }
    const inCourse = formatVocabLookupReply(w, { quiz: true, related: true });
    if (inCourse == null) {
      return deterministicReply({
        intent: "vocabulary_lookup",
        answer: `המילה **${w}** לא נמצאת במאגר אוצר המילים של הקורס, אז אין לי עליה כרטיסייה. שאלו אותי עליה במשפט רגיל (למשל: "מה המשמעות של ${w} במשפט הזה?") ואסביר מתוך ההקשר.`,
        questionType: "vocabulary",
        recommendedAction: "מודול אוצר המילים מסודר לפי רמות - שווה לעבור על הרמה שלכם.",
      });
    }
    const rel = suggestRelatedWords(w, 4);
    const text = inCourse + (rel.length ? `\n\nמילים נוספות באותו בלוק: **${rel.join("**, **")}**.` : "");
    return deterministicReply({
      intent: "vocabulary_lookup",
      answer: text,
      questionType: "vocabulary",
      recommendedAction: "המשיכו בכרטיסיות או בקוויז אוצר המילים בקורס.",
      safeFallback: false,
    });
  }

  if (intent === "performance_analysis") {
    if (!userId || !client) {
      return deterministicReply({
        intent: "performance_analysis",
        answer: "לניתוח ביצועים (נושאים חלשים, דיוק, מבחנים אחרונים) צריך חשבון מחובר. התחברו ונסו שוב.",
      });
    }
    const data = await loadPerformanceCoachInputs(client, userId);
    const c = buildPerformanceCoachCopy({ userStats: data.userStats, quizSnapshot: data.quizSnapshot });
    return amirantChatbotResponseSchema.parse({
      intent: "performance_analysis" as const,
      answer: c.text + (c.recommendedAction ? `\n\n**מה לעשות עכשיו:** ${c.recommendedAction}` : ""),
      questionType: "unknown",
      hintStage: null,
      nextHintAvailable: false,
      recommendedAction: c.recommendedAction,
      references: [],
      referencedChunks: [],
      usedStudentData: c.usedStudentData,
      safeFallback: !c.usedStudentData,
    });
  }

  if (intent === "recommendation") {
    if (!userId || !client) {
      return deterministicReply({
        intent: "recommendation",
        answer: "המלצה ממוקדת (מבחן, שיעור, מיקוד) עובדת הכי טוב אחרי התחברות - אז אפשר לקרוא את מסלול הלמידה שלכם. בינתיים: בחרו נושא שפחות בטוחים בו, עשו מבחן אדפטיבי קצר, וחזרו לשיעור הראשי בנושא הזה.",
        recommendedAction: "התחברו ושלחו שוב ״מה כדאי לי לעשות עכשיו?״",
      });
    }
    const data = await loadPerformanceCoachInputs(client, userId);
    const c = buildPerformanceCoachCopy({ userStats: data.userStats, quizSnapshot: data.quizSnapshot });
    return amirantChatbotResponseSchema.parse({
      intent: "recommendation" as const,
      answer: `**המלצה קצרה (לפי הנתונים):**\n${c.text}\n\n**מה לעשות עכשיו:** ${c.recommendedAction}`,
      questionType: "unknown",
      hintStage: null,
      nextHintAvailable: false,
      recommendedAction: c.recommendedAction,
      references: [],
      referencedChunks: [],
      usedStudentData: c.usedStudentData,
      safeFallback: !c.usedStudentData,
    });
  }

  // Only the model path needs the learner profile and the embedding; the deterministic
  // replies above return before paying for them.
  const [userStats, quizSnapshot, embeddingResult] = await Promise.all([
    userId && client ? loadAiUserStatsSnapshot(client, userId) : Promise.resolve(EMPTY_USER_STATS),
    userId && client ? loadAiQuizSnapshot(client, userId) : Promise.resolve(null),
    vectorText.trim() ? runEmbedding({ text: vectorText }).catch(() => null) : Promise.resolve(null),
  ]);
  const precomputedEmbedding = embeddingResult?.embedding;
  const learnerProfileText = buildLearnerProfileText(userStats, quizSnapshot, Boolean(userId));

  const chunks = await retrieveForLessonChat(client, {
    query: retrievalQuery,
    questionContext,
    lessonId: request.lessonId,
    topic: topicFilter,
    activeKind: active?.kind,
    precomputedEmbedding,
  });

  const chunkContextBlocks = chunks.map((c) => formatContextLine(c));
  const chunkIds = chunks.map((c) => c.id);

  const useStaged = shouldUseStagedHelp({ intent, wantsReveal, active });
  const promptStage4 = wantsReveal;
  const timedUnanswered = isRevealBlocked(active);

  let systemExtra = "";
  if (intent === "logistics") {
    systemExtra = "\n" + logisticsModePrompt();
  } else if (promptStage4) {
    systemExtra = "\n" + stagedHintModePrompt({ questionType, stage: 4, allowFullAnswer: true });
  } else if (useStaged) {
    systemExtra =
      "\n" +
      stagedHintModePrompt({
        questionType,
        stage: Math.min(stage, 3) as 1 | 2 | 3,
        allowFullAnswer: false,
        timedUnanswered,
      });
  }

  const outIntent: AmirantChatbotResponse["intent"] =
    promptStage4
      ? "reveal_answer"
      : intent === "staged_hint"
        ? "staged_hint"
        : intent === "question_help"
          ? "question_help"
          : intent === "logistics"
            ? "logistics"
            : "general_course_help";

  const systemPrompt = [lessonChatSystemPrompt(), systemExtra].join("");

  const activeForPrompt = resolveActiveContextForPrompt(
    active,
    (id) => {
      const q = getBankQuestion(id);
      return q ? { correctOptionId: q.correctOptionId, explanation: q.explanation } : undefined;
    },
    { staged: useStaged },
  );

  const userLine = [`Intent: ${outIntent}`, useStaged ? `staged-hint stage ${stage} (isNext: ${isNext})` : ""]
    .filter(Boolean)
    .join(" | ");

  const fullUserPrompt = [
    userLine,
    "",
    lessonChatPrompt({
      userMessage: request.userMessage,
      lessonId: request.lessonId ?? undefined,
      lessonTitle,
      moduleTitle,
      contextBlocks: chunkContextBlocks,
      learnerProfileText,
      activeContext: activeForPrompt,
      activeQuestionText: request.activeQuestionText,
      history: request.history,
    }),
    "",
    `Cite only chunk IDs from the context. Output intent: ${outIntent}.`,
  ].join("\n");

  let parsed: AmirantChatbotAiResponse;

  try {
    if (onToken) {
      // Streaming path: structured outputs (zodResponseFormat) + token callback
      const result = await streamOpenAiJsonResponse({
        systemPrompt,
        userPrompt: fullUserPrompt,
        operation: "lesson_chat",
        schema: amirantChatbotAiResponseSchema,
        schemaName: "amirant_chatbot",
        onToken,
        usageLog: { userId: userId ?? undefined, sessionId: logCtx?.sessionId, requestIp: logCtx?.requestIp },
      });
      parsed = { ...result, intent: outIntent, answer: normalizeModelLineBreaks(result.answer.replace(/—/g, "-")) };
    } else {
      // Non-streaming structured output path (default)
      const ai = await runStructuredAi({
        operation: "lesson_chat",
        schema: amirantChatbotAiResponseSchema,
        schemaName: "amirant_chatbot",
        systemPrompt,
        userPrompt: fullUserPrompt,
        cacheContext: { userQuery: request.userMessage + outIntent + String(stage), chunkIds },
        usageLog: { userId: userId ?? undefined, sessionId: logCtx?.sessionId, requestIp: logCtx?.requestIp },
      });
      parsed = { ...ai.output, intent: outIntent, answer: normalizeModelLineBreaks(ai.output.answer.replace(/—/g, "-")) };
    }
    // Numbers the model may repeat: the learner's own data, what is on screen, the course
    // chunks it was given, and the exam facts. Anything else is treated as invented.
    const safety = validateAiGroundedNumericClaims({
      texts: [parsed.answer],
      allowedSnapshots: [request, userStats, quizSnapshot, { chunks: chunks.map((c) => c.text) }, examFacts],
    });
    if (!safety.ok) {
      logAiSafetyValidationFailure({ operation: "lesson_chat", userId: userId ?? undefined, violations: safety.violations });
      parsed = {
        intent: outIntent,
        answer: "לא הצלחתי לאמת חלק מהמספרים בתשובה, אז עצרתי אותה ליתר ביטחון. נסחו את השאלה שוב, או שאלו בלי להתייחס לציונים ומספרים.",
        questionType,
        hintStage: useStaged ? (Math.min(stage, 3) as 1 | 2 | 3) : promptStage4 ? 4 : null,
        nextHintAvailable: useStaged && stage < 3,
        recommendedAction: null,
        usedStudentData: false,
        safeFallback: true,
        references: [],
      };
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[chatbot-router] AI call failed:", errMsg);
    parsed = {
      intent: outIntent,
      answer: "משהו השתבש אצלי - שלחו שוב בעוד רגע. אם זה חוזר, נסחו את השאלה קצת אחרת.",
      questionType,
      hintStage: useStaged ? (Math.min(stage, 3) as 1 | 2 | 3) : promptStage4 ? 4 : null,
      nextHintAvailable: useStaged && stage < 3,
      recommendedAction: null,
      usedStudentData: false,
      safeFallback: true,
      references: [],
    };
  }

  const outHintStage: 1 | 2 | 3 | 4 | null = useStaged
    ? ((Math.min(stage, 3) as 1 | 2 | 3))
    : wantsReveal
      ? 4
      : null;
  const nextHint = useStaged && Math.min(stage, 3) < 3;

  return mergeResponse(
    {
      ...parsed,
      questionType: parsed.questionType ?? questionType,
      hintStage: outHintStage,
      nextHintAvailable: nextHint,
      usedStudentData: parsed.usedStudentData,
      safeFallback: parsed.safeFallback,
      references: parsed.references.map((r) => ({
        chunkId: r.chunkId,
        lessonId: r.lessonId ?? undefined,
        topic: r.topic ?? undefined,
      })),
    },
    chunks,
  );
}
