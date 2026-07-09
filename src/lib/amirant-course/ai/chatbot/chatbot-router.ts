import type { SupabaseClient } from "@supabase/supabase-js";
import { runStructuredAi, streamOpenAiJsonResponse } from "../create-ai-client";
import { amirantRagSystemPrompt, lessonChatPrompt } from "../prompts";
import {
  type RetrievedChunk,
  type AiUserStatsSnapshot,
  type AiQuizSnapshot,
  buildVectorQueryText,
  formatChunkContextLine,
  loadAiQuizSnapshot,
  loadAiUserStatsSnapshot,
  retrieveCourseChunks,
} from "../retrieval";
import { runEmbedding } from "../openai-client";
import { normalizeChunkReferences } from "../reference-utils";
import { validateAiGroundedNumericClaims } from "../safety";
import { logAiSafetyValidationFailure } from "../ai-usage";
import type { AiRequestLogContext } from "../ai-request-context";
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

export async function runAmirantChatbot(
  client: SupabaseClient,
  userId: string | null,
  raw: unknown,
  logCtx?: AiRequestLogContext,
  /** Optional streaming callback - receives answer tokens as they arrive (OpenAI streaming path only). */
  onToken?: (delta: string) => void,
): Promise<AmirantChatbotResponse> {
  const request = amirantChatbotRequestSchema.parse(raw) as AmirantChatbotRequest;
  const { intent, explicitReveal } = classifyChatIntent(request);

  const questionTypeFromClient = mapQuestionType(request.stagedHintContext?.questionType);
  const questionTypeInferred = inferQuestionTypeHeuristic(request.userMessage);
  const questionType: AmirantQuestionType | "unknown" =
    questionTypeFromClient !== "unknown" ? questionTypeFromClient : questionTypeInferred;

  const { stage, isNext } = resolveStagedStage(request, intent);

  const questionContext = request.lessonId
    ? `Amirant preparation - focus on lesson ${request.lessonId}${request.topic ? `, topic ${request.topic}` : ""}.`
    : `Amirant preparation - course-wide. ${request.topic ? ` topic filter: ${request.topic}.` : ""}`;

  // שאלות המשך קצרות ("לא הבנתי", "ומה לגבי...") נשענות על ההודעה הקודמת -
  // מוסיפים את התור האחרון לשאילתת האחזור כדי שה-RAG ימצא את ההקשר הנכון.
  const lastUserTurn = request.history?.filter((h) => h.role === "user").slice(-1)[0]?.text ?? "";
  const retrievalQuery =
    request.userMessage.length < 60 && lastUserTurn
      ? `${lastUserTurn}\n${request.userMessage}`
      : request.userMessage;

  const vectorText = buildVectorQueryText({
    query: retrievalQuery,
    questionContext,
    lessonId: request.lessonId,
    topic: request.topic,
  });

  // Parallelize: user stats + quiz snapshot + embedding computation - none depend on each other
  const [userStats, quizSnapshot, embeddingResult] = await Promise.all([
    userId ? loadAiUserStatsSnapshot(client, userId) : Promise.resolve(EMPTY_USER_STATS),
    userId ? loadAiQuizSnapshot(client, userId) : Promise.resolve(null),
    vectorText.trim() ? runEmbedding({ text: vectorText }).catch(() => null) : Promise.resolve(null),
  ]);
  const precomputedEmbedding = embeddingResult?.embedding;

  const userStatsText = JSON.stringify(userStats);
  const quizStatsText = JSON.stringify(quizSnapshot ?? { note: "no quiz snapshot" });

  if (intent === "vocabulary_lookup" || (request.clientAction === "vocab_lookup" && request.vocabularyWord)) {
    const w =
      (request.vocabularyWord?.trim() && request.vocabularyWord.toLowerCase()) ||
      extractEnglishWordForVocab(request.userMessage, request.vocabularyWord) ||
      null;
    if (!w) {
      return amirantChatbotResponseSchema.parse({
        intent: "vocabulary_lookup" as const,
        answer: "רשמו מילה באנגלית לבדיקה, או מלאו בכותרת אחרי ״בדוק מילה״.",
        questionType: "vocabulary" as const,
        hintStage: null,
        nextHintAvailable: false,
        recommendedAction: null,
        references: [],
        referencedChunks: [],
        usedStudentData: false,
        safeFallback: true,
      });
    }
    const inCourse = formatVocabLookupReply(w, { quiz: true, related: true });
    if (inCourse == null) {
      return amirantChatbotResponseSchema.parse({
        intent: "vocabulary_lookup" as const,
        answer: `המילה **${w}** לא נמצאת במאגר אוצר המילים של הקורס, אז אין לי עליה כרטיסייה מוכנה. אפשר לשאול אותי עליה במשפט רגיל (למשל: "מה המשמעות של ${w} במשפט הזה?") ואנסה לעזור מתוך חומרי הקורס.`,
        questionType: "vocabulary" as const,
        hintStage: null,
        nextHintAvailable: false,
        recommendedAction: "מומלץ לעבור על מודול אוצר המילים - 2000+ מילים מסודרות לפי רמות.",
        references: [],
        referencedChunks: [],
        usedStudentData: false,
        safeFallback: true,
      });
    }
    const rel = suggestRelatedWords(w, 4);
    const text = inCourse + (rel.length ? `\n\nמילים נוספות בבלוק: **${rel.join("**, **")}**.` : "");
    return amirantChatbotResponseSchema.parse({
      intent: "vocabulary_lookup" as const,
      answer: text,
      questionType: "vocabulary" as const,
      hintStage: null,
      nextHintAvailable: false,
      recommendedAction: "המשיכו בכרטיסיות או בקוויז אוצר מילים בקורס.",
      references: [],
      referencedChunks: [],
      usedStudentData: false,
      safeFallback: false,
    });
  }

  if (intent === "performance_analysis") {
    if (!userId) {
      return amirantChatbotResponseSchema.parse({
        intent: "performance_analysis" as const,
        answer: "לניתוח ביצועים (נושאים חלשים, דיוק, מבחנים אחרונים) צריך חשבון מחובר. התחברו ונסו שוב.",
        questionType: "unknown" as const,
        hintStage: null,
        nextHintAvailable: false,
        recommendedAction: null,
        references: [],
        referencedChunks: [],
        usedStudentData: false,
        safeFallback: true,
      });
    }
    const data = await loadPerformanceCoachInputs(client, userId);
    const c = buildPerformanceCoachCopy({ userStats: data.userStats, quizSnapshot: data.quizSnapshot });
    const outIntent: AmirantChatbotResponse["intent"] = "performance_analysis";
    return amirantChatbotResponseSchema.parse({
      intent: outIntent,
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
    if (!userId) {
      return amirantChatbotResponseSchema.parse({
        intent: "recommendation" as const,
        answer: "המלצה ממוקדת (מבחן, שיעור, מיקוד) עובדת הכי טוב אחרי התחברות - כי אז אפשר לקרוא מסלול הלמידה שלכם. בינתיים: בחרו נושא שמפחדים ממנו, עשו מבחן אדפטיבי קצר, וחזרו לשיעור הראשי בנושא הזה.",
        questionType: "unknown" as const,
        hintStage: null,
        nextHintAvailable: false,
        recommendedAction: "התחברו ושלחו שוב ״מה כדאי לי לעשות עכשיו?״",
        references: [],
        referencedChunks: [],
        usedStudentData: false,
        safeFallback: true,
      });
    }
    const data = await loadPerformanceCoachInputs(client, userId);
    const c = buildPerformanceCoachCopy({ userStats: data.userStats, quizSnapshot: data.quizSnapshot });
    return amirantChatbotResponseSchema.parse({
      intent: "recommendation" as const,
      answer: `**המלצה קצרה (לפי הנתונים):**\n${c.text}\n\n**למה זה משנה:** בנייה של חולשה מוקדם חוסכת שגויים במבחן האמיתי.\n\n**מה לעשות עכשיו:** ${c.recommendedAction}`,
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

  const baseRetrieval = {
    query: retrievalQuery,
    questionContext,
    lessonId: request.lessonId,
    operation: "lesson_chat" as const,
    precomputedEmbedding,
  };
  // בחירת ה-client לאחזור (service, בגלל RLS) חיה בתוך retrieveCourseChunks -
  // כך גם quiz-review/recommendations/coach מקבלים את אותו תיקון.
  let chunks = await retrieveCourseChunks(client, { ...baseRetrieval, topic: request.topic });
  if (chunks.length === 0 && request.topic) {
    chunks = await retrieveCourseChunks(client, { ...baseRetrieval, topic: undefined });
  }
  if (chunks.length === 0 && request.lessonId) {
    chunks = await retrieveCourseChunks(client, { ...baseRetrieval, lessonId: undefined, topic: request.topic });
  }
  if (chunks.length === 0 && request.lessonId && request.topic) {
    chunks = await retrieveCourseChunks(client, { ...baseRetrieval, lessonId: undefined, topic: undefined });
  }

  const chunkContextBlocks = chunks.map((c) => formatChunkContextLine(c));
  const chunkIds = chunks.map((c) => c.id);

  const wantsReveal = explicitReveal || intent === "reveal_answer" || stage >= 4;
  const inStagedHelp = intent === "staged_hint" || intent === "question_help";
  const useStaged = inStagedHelp && !wantsReveal;
  const promptStage4 = wantsReveal;

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
      });
  }

  // גם בלי קטעי קורס תואמים ממשיכים למודל - הוא עונה ברמת אסטרטגיה כללית
  // (בלי להמציא עובדות מבחן) במקום סירוב שגורם לתחושת "הבוט לא עוזר".

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

  const systemPrompt = [
    amirantRagSystemPrompt("lesson_chat"),
    systemExtra,
    "\n",
    "You MUST return JSON fields answer, questionType, hintStage, nextHintAvailable, recommendedAction, safeFallback, references chunkIds, usedStudentData when relevant.",
  ].join("");

  const userLine = [outIntent, useStaged ? `staged-hint stage ${stage} (isNext: ${isNext})` : ""]
    .filter(Boolean)
    .join(" | ");

  const userPrompt = [
    userLine,
    "\n",
    lessonChatPrompt({
      userMessage: request.userMessage,
      lessonId: request.lessonId ?? undefined,
      contextBlocks: chunkContextBlocks,
      userStatsText,
      quizStatsText,
      activeQuestionText: request.activeQuestionText,
      history: request.history,
    }),
  ].join("");

  let parsed: AmirantChatbotAiResponse;
  const fullUserPrompt = userPrompt + `\n\nCite only chunkIds from the context. Output intent: ${outIntent}.`;

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
      });
      parsed = { ...result, intent: outIntent, answer: result.answer.replace(/—/g, "-") };
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
      parsed = { ...ai.output, intent: outIntent, answer: ai.output.answer.replace(/—/g, "-") };
    }
    const safety = validateAiGroundedNumericClaims({
      texts: [parsed.answer],
      allowedSnapshots: [request, userStats, quizSnapshot],
    });
    if (!safety.ok) {
      logAiSafetyValidationFailure({ operation: "lesson_chat", userId: userId ?? undefined, violations: safety.violations });
      parsed = {
        intent: outIntent,
        answer: "לא הצלחתי לאמת חלק מהנתונים בתשובה, אז עצרתי אותה ליתר ביטחון. נסו לנסח את השאלה שוב - או שאלו אותי בלי להתייחס לציונים ומספרים.",
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
      answer: "משהו השתבש אצלי - נסו לשלוח שוב בעוד רגע. אם זה חוזר על עצמו, נסחו את השאלה קצת אחרת.",
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
