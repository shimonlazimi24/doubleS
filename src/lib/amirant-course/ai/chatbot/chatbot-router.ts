import type { SupabaseClient } from "@supabase/supabase-js";
import { runStructuredAi } from "../create-ai-client";
import { amirantRagSystemPrompt, lessonChatPrompt } from "../prompts";
import {
  type RetrievedChunk,
  type AiUserStatsSnapshot,
  type AiQuizSnapshot,
  formatChunkContextLine,
  loadAiQuizSnapshot,
  loadAiUserStatsSnapshot,
  retrieveCourseChunks,
} from "../retrieval";
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
): Promise<AmirantChatbotResponse> {
  const request = amirantChatbotRequestSchema.parse(raw) as AmirantChatbotRequest;
  const { intent, explicitReveal } = classifyChatIntent(request);

  const questionTypeFromClient = mapQuestionType(request.stagedHintContext?.questionType);
  const questionTypeInferred = inferQuestionTypeHeuristic(request.userMessage);
  const questionType: AmirantQuestionType | "unknown" =
    questionTypeFromClient !== "unknown" ? questionTypeFromClient : questionTypeInferred;

  const { stage, isNext } = resolveStagedStage(request, intent);
  const userStats: AiUserStatsSnapshot = userId
    ? await loadAiUserStatsSnapshot(client, userId)
    : EMPTY_USER_STATS;
  const quizSnapshot: AiQuizSnapshot | null = userId ? await loadAiQuizSnapshot(client, userId) : null;
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
        answer: `המילה **${w}** אינה מזוהה כרגע בקבצי אוצר המילים שסרקנו בקורס, ולכן אין \"תרגום־רשמי\" מהמאגר. בואו בחומר Vocabulary / קוויז, או שאלו על משפט-הקשר ברמת RAG (בלי להמציא אוצר).`,
        questionType: "vocabulary" as const,
        hintStage: null,
        nextHintAvailable: false,
        recommendedAction: "לעבור למודול אוצר מילים ולחפש הערה דומה, או לבחור שיעור vocabulary מהמניפסט.",
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
        answer: "המלצה ממוקדת (מבחן, שיעור, מיקוד) עובדת הכי טוב אחרי התחברות — כי אז אפשר לקרוא מסלול הלמידה שלכם. בינתיים: בחרו נושא שמפחדים ממנו, עשו מבחן אדפטיבי קצר, וחזרו לשיעור הראשי בנושא הזה.",
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

  const questionContext = request.lessonId
    ? `Amirant preparation — focus on lesson ${request.lessonId}${request.topic ? `, topic ${request.topic}` : ""}.`
    : `Amirant preparation — course-wide. ${request.topic ? ` topic filter: ${request.topic}.` : ""}`;

  const baseRetrieval = {
    query: request.userMessage,
    questionContext,
    lessonId: request.lessonId,
    operation: "lesson_chat" as const,
  };
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

  if (chunks.length === 0) {
    return amirantChatbotResponseSchema.parse({
      intent: (intent === "logistics" ? "logistics" : "general_course_help") as AmirantChatbotResponse["intent"],
      answer:
        "אין כרגע קטעי קורס רלוונטיים לשאלה הזו, ולכן אי אפשר לתת תשובה מבוססת מקור. פתח/י שיעור או שאל/י בצורה ספציפית יותר (או «תנו לי רמז» במקום הפתרון המלא).",
      questionType,
      hintStage: useStaged ? (Math.min(stage, 3) as 1 | 2 | 3) : wantsReveal ? 4 : null,
      nextHintAvailable: useStaged && stage < 3,
      recommendedAction: "לפתוח שיעור ממודול רלוונטי ולנסות שוב.",
      references: [],
      referencedChunks: [],
      usedStudentData: false,
      safeFallback: true,
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
    }),
  ].join("");

  let parsed: AmirantChatbotAiResponse;

  try {
    const ai = await runStructuredAi({
      operation: "lesson_chat",
      schema: amirantChatbotAiResponseSchema,
      schemaName: "amirant_chatbot",
      systemPrompt,
      userPrompt: userPrompt + `\n\nCite only chunkIds from the context. Output intent: ${outIntent}.`,
      cacheContext: { userQuery: request.userMessage + outIntent + String(stage), chunkIds },
      usageLog: { userId: userId ?? undefined, sessionId: logCtx?.sessionId, requestIp: logCtx?.requestIp },
    });
    const safety = validateAiGroundedNumericClaims({
      texts: [ai.output.answer],
      allowedSnapshots: [request, userStats, quizSnapshot],
    });
    if (!safety.ok) {
      logAiSafetyValidationFailure({ operation: "lesson_chat", userId: userId ?? undefined, violations: safety.violations });
      parsed = {
        intent: outIntent,
        answer: "התשובה נבלמה — זוהו מספרים/טענות שאי אפשר לאמת מנתוני הקורס. נסו/י שוב, או פתח/י שיעור רלוונטי.",
        questionType,
        hintStage: useStaged ? (Math.min(stage, 3) as 1 | 2 | 3) : promptStage4 ? 4 : null,
        nextHintAvailable: useStaged && stage < 3,
        recommendedAction: "חזרו לניסוח או הוסיפו הקשר מחומר הקורס בלבד.",
        usedStudentData: false,
        safeFallback: true,
        references: [],
      };
    } else {
      parsed = { ...ai.output, intent: outIntent };
    }
  } catch {
    parsed = {
      intent: outIntent,
      answer: "המודל לא הצליח להשיב כרגע. נסו/י שוב או נסחו קצר יותר.",
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
      references: parsed.references,
    },
    chunks,
  );
}
