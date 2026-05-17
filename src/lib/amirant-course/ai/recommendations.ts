import type { SupabaseClient } from "@supabase/supabase-js";
import { runStructuredAi } from "./create-ai-client";
import { AI_PROMPT_VERSION, amirantRagSystemPrompt, recommendationsPrompt } from "./prompts";
import {
  recommendationsRequestSchema,
  recommendationsResponseSchema,
  type RecommendationsRequest,
  type RecommendationsResponse,
} from "./schemas";
import {
  type AiQuizSnapshot,
  type AiUserStatsSnapshot,
  formatChunkContextLine,
  loadAiQuizSnapshot,
  loadAiUserStatsSnapshot,
  retrieveCourseChunks,
} from "./retrieval";
import { normalizeChunkReferences } from "./reference-utils";
import { validateAiGroundedNumericClaims } from "./safety";
import { logAiSafetyValidationFailure } from "./ai-usage";
import type { AiRequestLogContext } from "./ai-request-context";

const EMPTY_USER_STATS: AiUserStatsSnapshot = { topicRollups: [], adaptiveState: [] };

/**
 * `userId` null = אורח (למשל אנליטיקה מקומית בלי התחברות). אין קריאות ל-DB לפי משתמש, ואין `amirant_ai_insights` insert.
 */
export async function runRecommendationsAi(
  client: SupabaseClient,
  userId: string | null,
  raw: unknown,
  logCtx?: AiRequestLogContext,
): Promise<RecommendationsResponse> {
  const request = recommendationsRequestSchema.parse(raw) as RecommendationsRequest;

  const topWeak = request.weakTopics[0] ?? undefined;
  const [userStats, quizSnapshot]: [AiUserStatsSnapshot, AiQuizSnapshot | null] = userId
    ? await Promise.all([loadAiUserStatsSnapshot(client, userId), loadAiQuizSnapshot(client, userId)])
    : [EMPTY_USER_STATS, null];
  const qBase = {
    query: request.improvementHint?.trim() || "Amirant study plan and topic priorities",
    questionContext: [
      `Weak topics: ${request.weakTopics.join(", ") || "none"}`,
      `Strong topics: ${request.strongTopics.join(", ") || "none"}`,
    ].join("\n"),
    operation: "recommendations" as const,
  };
  let chunks = await retrieveCourseChunks(client, { ...qBase, topic: topWeak });
  if (chunks.length === 0 && topWeak) {
    chunks = await retrieveCourseChunks(client, { ...qBase, topic: undefined });
  }
  const userStatsText = JSON.stringify(userStats);
  const quizStatsText = JSON.stringify(quizSnapshot ?? { note: "no quiz snapshot" });
  const chunkContextBlocks = chunks.map((c) => formatChunkContextLine(c));
  const chunkIds = chunks.map((c) => c.id);
  const cacheUserQuery = [request.weakTopics.join(","), request.strongTopics.join(","), request.improvementHint ?? ""].join(
    "\n",
  );

  let output: RecommendationsResponse = {
    priorities: request.weakTopics.slice(0, 3),
    weeklyPlan: [
      "יום 1-2: חזרה על יסודות בנושא חלש מרכזי",
      "יום 3-4: תרגול ממוקד ברמות 2-4",
      "יום 5: מבחן קצר + ניתוח שגיאות",
      "יום 6-7: חיזוק נושא משני וסיכום",
    ],
    why: request.improvementHint || "התכנית מבוססת על נושאי החולשה הקיימים.",
    references: normalizeChunkReferences([], chunks),
    safeFallback: true,
  };
  let model = "fallback";
  let safetyViolation: string[] = [];

  if (chunks.length > 0) {
    try {
      const ai = await runStructuredAi({
        operation: "recommendations",
        schema: recommendationsResponseSchema,
        schemaName: "amirant_recommendations",
        systemPrompt: amirantRagSystemPrompt("recommendations"),
        userPrompt: recommendationsPrompt({
          weakTopics: request.weakTopics,
          strongTopics: request.strongTopics,
          improvementHint: request.improvementHint,
          contextBlocks: chunkContextBlocks,
          userStatsText,
          quizStatsText,
        }),
        cacheContext: { userQuery: cacheUserQuery, chunkIds },
        usageLog: { userId: userId ?? undefined, sessionId: logCtx?.sessionId, requestIp: logCtx?.requestIp },
      });
      output = {
        ...ai.output,
        references: normalizeChunkReferences(ai.output.references, chunks),
      };
      const safety = validateAiGroundedNumericClaims({
        texts: [output.why, ...output.priorities, ...output.weeklyPlan],
        allowedSnapshots: [request, userStats, quizSnapshot],
      });
      if (!safety.ok) {
        safetyViolation = safety.violations;
        logAiSafetyValidationFailure({
          operation: "recommendations",
          userId: userId ?? undefined,
          violations: safety.violations,
        });
        output = {
          priorities: request.weakTopics.slice(0, 3),
          weeklyPlan: [
            "בצע/י תרגול ממוקד בנושא החלש ביותר",
            "בדוק/י התקדמות אחרי ניסיון נוסף",
          ],
          why:
            "התשובה האוטומטית נחסמה כי הכילה טענות מספריות לא מאומתות מהנתונים שלך.",
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
      priorities: request.weakTopics.slice(0, 3),
      weeklyPlan: [
        "בחר/י נושא חלש אחד והשלם/י בו סט תרגול ממוקד",
        "בצע/י בוחן קצר להשוואת התקדמות",
      ],
      why: "אין כרגע הקשר תוכן מספק, לכן התכנית נשארת כללית ושמרנית.",
      references: [],
      safeFallback: true,
    };
  }

  if (userId) {
    await client.from("amirant_ai_insights").insert({
      user_id: userId,
      insight_kind: "recommendations",
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
  }

  return recommendationsResponseSchema.parse(output);
}
