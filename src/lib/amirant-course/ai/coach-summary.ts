import type { SupabaseClient } from "@supabase/supabase-js";
import { runStructuredAi } from "./create-ai-client";
import { AI_PROMPT_VERSION, amirantRagSystemPrompt, coachSummaryPrompt } from "./prompts";
import {
  coachSummaryRequestSchema,
  coachSummaryResponseSchema,
  type CoachSummaryRequest,
  type CoachSummaryResponse,
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

export async function runCoachSummaryAi(
  client: SupabaseClient,
  userId: string,
  raw: unknown,
  logCtx?: AiRequestLogContext,
): Promise<CoachSummaryResponse> {
  const request = coachSummaryRequestSchema.parse(raw) as CoachSummaryRequest;
  const [userStats, quizSnapshot] = await Promise.all([
    loadAiUserStatsSnapshot(client, userId),
    loadAiQuizSnapshot(client, userId),
  ]);
  const chunks = await retrieveCourseChunks(client, {
    query: "Amirant coach summary and next study steps",
    questionContext: [
      `Weak topics: ${request.weakTopics.join(", ") || "none"}`,
      `Strong topics: ${request.strongTopics.join(", ") || "none"}`,
      `Latest score: ${request.latestScorePct != null ? `${request.latestScorePct}%` : "unknown"}`,
      `Sessions: ${request.sessionsCount}`,
    ].join("\n"),
    topic: request.weakTopics[0] ?? request.strongTopics[0],
    operation: "coach_summary",
  });
  const userStatsText = JSON.stringify(userStats);
  const quizStatsText = JSON.stringify(quizSnapshot ?? { note: "no quiz snapshot" });
  const chunkContextBlocks = chunks.map((c) => formatChunkContextLine(c));
  const chunkIds = chunks.map((c) => c.id);
  const cacheUserQuery = [
    request.weakTopics.join(","),
    request.strongTopics.join(","),
    String(request.latestScorePct ?? ""),
    String(request.sessionsCount),
  ].join("\n");

  let output: CoachSummaryResponse = {
    coachSummary:
      "אין מספיק הקשר מהקורס כרגע. כדאי לבצע מבחן נוסף ולהשלים שיעור בנושא חלש כדי לקבל המלצה מדויקת יותר.",
    confidence: "low",
    references: normalizeChunkReferences([], chunks),
    safeFallback: true,
  };
  let model = "fallback";
  let safetyViolation: string[] = [];

  if (chunks.length > 0) {
    try {
      const ai = await runStructuredAi({
        operation: "coach_summary",
        schema: coachSummaryResponseSchema,
        schemaName: "amirant_coach_summary",
        systemPrompt: amirantRagSystemPrompt("coach_summary"),
        userPrompt: coachSummaryPrompt({
          weakTopics: request.weakTopics,
          strongTopics: request.strongTopics,
          latestScorePct: request.latestScorePct,
          sessionsCount: request.sessionsCount,
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
        texts: [output.coachSummary],
        allowedSnapshots: [request, userStats, quizSnapshot],
      });
      if (!safety.ok) {
        safetyViolation = safety.violations;
        logAiSafetyValidationFailure({
          operation: "coach_summary",
          userId,
          violations: safety.violations,
        });
        output = {
          coachSummary:
            "סיכום המאמן נחסם כי נמצאו טענות מספריות שאינן מגובות בנתוני המשתמש.",
          confidence: "low",
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
      coachSummary:
        "אין כרגע קטעי תוכן רלוונטיים לסיכום ממוקד, ולכן מוצגת המלצה כללית בלבד עד שיהיה הקשר נוסף.",
      confidence: "low",
      references: [],
      safeFallback: true,
    };
  }

  await client.from("amirant_ai_insights").insert({
    user_id: userId,
    insight_kind: "coach_summary",
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

  return coachSummaryResponseSchema.parse(output);
}
