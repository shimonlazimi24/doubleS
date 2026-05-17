import type { SupabaseClient } from "@supabase/supabase-js";
import { runStructuredAi } from "./create-ai-client";
import { AI_PROMPT_VERSION, amirantRagSystemPrompt, quizReviewPrompt } from "./prompts";
import {
  quizReviewRequestSchema,
  quizReviewResponseSchema,
  type QuizReviewRequest,
  type QuizReviewResponse,
} from "./schemas";
import {
  formatChunkContextLine,
  loadAiQuizSnapshot,
  loadAiUserStatsSnapshot,
  retrieveCourseChunks,
} from "./retrieval";
import { normalizeChunkReferences } from "./reference-utils";
import { validateAiGroundedNumericClaims } from "./safety";
import { logAiSafetyValidationFailure } from "./ai-usage";
import type { AiRequestLogContext } from "./ai-request-context";

export async function runQuizReviewAi(
  client: SupabaseClient,
  userId: string,
  raw: unknown,
  logCtx?: AiRequestLogContext,
): Promise<QuizReviewResponse> {
  const request = quizReviewRequestSchema.parse(raw) as QuizReviewRequest;
  const [quizSnapshot, userStats] = await Promise.all([
    loadAiQuizSnapshot(client, userId, request.quizAttemptId),
    loadAiUserStatsSnapshot(client, userId),
  ]);
  const chunks = await retrieveCourseChunks(client, {
    query: "Quiz review: focus on wrong answers and related course material",
    questionContext: [
      `Attempt id: ${request.quizAttemptId}`,
      `Weak topics: ${request.weakTopics.join(", ") || "none"}`,
      `Wrong question ids: ${request.wrongQuestionIds.join(", ") || "none"}`,
    ].join("\n"),
    topic: request.weakTopics[0],
    operation: "quiz_review",
  });
  const userStatsText = JSON.stringify(userStats);
  const quizStatsText = JSON.stringify(quizSnapshot ?? { note: "no quiz snapshot" });
  const chunkContextBlocks = chunks.map((c) => formatChunkContextLine(c));
  const chunkIds = chunks.map((c) => c.id);
  const cacheUserQuery = [request.quizAttemptId, request.weakTopics.join(","), request.wrongQuestionIds.join(",")].join(
    "\n",
  );

  let output: QuizReviewResponse = {
    summary: "אין מספיק הקשר לשאלות הטעויות כרגע, ולכן מוצג סיכום בטוח.",
    actionItems: [
      "חזור/י על נושאי החולשה מהשיעורים המתאימים",
      "פתור/י 10-15 שאלות ממוקדות בנושא החלש ביותר",
      "בדוק/י שוב את השאלות השגויות עם הסבר מלא",
    ],
    references: normalizeChunkReferences([], chunks),
    safeFallback: true,
  };
  let model = "fallback";
  let safetyViolation: string[] = [];

  if (chunks.length > 0) {
    try {
      const ai = await runStructuredAi({
        operation: "quiz_review",
        schema: quizReviewResponseSchema,
        schemaName: "amirant_quiz_review",
        systemPrompt: amirantRagSystemPrompt("quiz_review"),
        userPrompt: quizReviewPrompt({
          weakTopics: request.weakTopics,
          wrongQuestionIds: request.wrongQuestionIds,
          contextBlocks: chunkContextBlocks,
          userStatsText,
          quizStatsText,
        }),
        cacheContext: { userQuery: cacheUserQuery, chunkIds },
        usageLog: { userId, sessionId: logCtx?.sessionId, requestIp: logCtx?.requestIp },
      });
      output = {
        ...ai.output,
        references: normalizeChunkReferences(ai.output.references, chunks),
      };
      const safety = validateAiGroundedNumericClaims({
        texts: [output.summary, ...output.actionItems],
        allowedSnapshots: [request, userStats, quizSnapshot],
      });
      if (!safety.ok) {
        safetyViolation = safety.violations;
        logAiSafetyValidationFailure({
          operation: "quiz_review",
          userId,
          violations: safety.violations,
        });
        output = {
          summary:
            "התשובה נבלמה כי זוהו טענות מספריות שאינן מגובות בנתוני המשתמש.",
          actionItems: [
            "בדוק/י את סקירת הטעויות מתוך הנתונים השמורים בלבד",
            "הרץ/י בוחן נוסף לקבלת נתונים מאומתים",
          ],
          references: normalizeChunkReferences([], chunks),
          safeFallback: true,
        };
        model = `${ai.model}:blocked_by_safety`;
      } else {
        model = ai.model;
      }
    } catch {
      /* keep fallback */
    }
  } else {
    output = {
      summary: "לא נמצאו קטעי תוכן רלוונטיים כרגע, ולכן הסקירה נשארת כללית ובטוחה.",
      actionItems: [
        "פתח/י את יחידת הלימוד של נושא החולשה ובצע/י ניסיון נוסף",
        "בדוק/י את השאלות השגויות מול ההסברים הרשמיים בלבד",
      ],
      references: [],
      safeFallback: true,
    };
  }

  await client.from("amirant_ai_insights").insert({
    user_id: userId,
    insight_kind: "quiz_review",
    model,
    prompt_version: AI_PROMPT_VERSION,
    input_refs: chunks.map((c) => ({
      chunkId: c.id,
      lessonId: c.lessonId,
      topic: c.topic,
      similarity: c.similarity,
    })),
    input_payload: {
      ...request,
      userStats,
      quizSnapshot,
      aiSafety: {
        validationFailed: safetyViolation.length > 0,
        violations: safetyViolation,
      },
    },
    output_payload: output,
  });

  return quizReviewResponseSchema.parse(output);
}
