import type { SupabaseClient } from "@supabase/supabase-js";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { runEmbedding } from "./openai-client";

const RAG_TOPK_MIN = 5;
const RAG_TOPK_MAX = 8;

export type RetrievedChunk = {
  id: string;
  lessonId?: string;
  topic?: string;
  text: string;
  /** Cosine similarity in [0,1] from `match_course_content_chunks` (higher = closer). Omitted in non-vector fallbacks. */
  similarity?: number;
};

export type RetrieveCourseChunksParams = {
  /** Main search intent (e.g. student message). */
  query?: string;
  /**
   * Extra phrasing (quiz topics, attempt id, plan hints) merged into the embedding for relevance.
   * Not required to be a full sentence.
   */
  questionContext?: string;
  lessonId?: string;
  topic?: string;
  /** Pre-computed embedding vector - skips the runEmbedding call when provided. */
  precomputedEmbedding?: number[];
  /**
   * Number of chunks to pass to the model, clamped to 5–8. Default 8.
   * RPC over-fetches, then we filter and sort.
   */
  topK?: number;
  /**
   * Minimum vector similarity; chunks below (when scores exist) are dropped. Default from `AI_RAG_MIN_SIMILARITY` or 0.18. Set to `0` in env to disable.
   */
  minSimilarity?: number;
  /** For structured logs. */
  operation?: string;
};

function clampRagTopK(n?: number): number {
  const t = n ?? 8;
  return Math.min(RAG_TOPK_MAX, Math.max(RAG_TOPK_MIN, Math.floor(t)));
}

function getRagMinSimilarity(explicit?: number): number {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit >= 0) {
    return Math.min(1, explicit);
  }
  const raw = process.env.AI_RAG_MIN_SIMILARITY?.trim();
  if (raw === "0" || raw === "0.0") return 0;
  if (!raw) return 0.18;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.18;
}

/** Over-fetch from the index before similarity filtering and `topK` cut. */
function overfetchCount(topK: number): number {
  return Math.min(32, Math.max(12, topK * 3));
}

/**
 * Composes a single string for the embedding: main query, optional question context, and filter hints.
 */
export function buildVectorQueryText(params: {
  query?: string;
  questionContext?: string;
  lessonId?: string;
  topic?: string;
}): string {
  const parts: string[] = [];
  const q = params.query?.trim();
  if (q) parts.push(q);
  const ctx = params.questionContext?.trim();
  if (ctx) parts.push(ctx);
  if (params.topic?.trim()) parts.push(`[topic] ${params.topic.trim()}`);
  if (params.lessonId?.trim()) parts.push(`[lesson] ${params.lessonId.trim()}`);
  return parts.join("\n\n");
}

/**
 * Renders a chunk for the user prompt, including optional similarity (model sees relevance ordering).
 */
export function formatChunkContextLine(chunk: RetrievedChunk): string {
  const sim = chunk.similarity != null ? `|sim:${Number(chunk.similarity).toFixed(3)}` : "";
  return `[chunk:${chunk.id}${sim}] ${chunk.text}`;
}

function logRagRetrieval(params: {
  operation?: string;
  lessonId?: string;
  topic?: string;
  minSimilarity: number;
  topK: number;
  items: { id: string; similarity?: number }[];
}): void {
  // eslint-disable-next-line no-console -- RAG diagnostic (ids + scores only, no PII in ids)
  console.info(
    JSON.stringify({
      t: new Date().toISOString(),
      event: "rag_retrieval",
      operation: params.operation ?? "unknown",
      lessonId: params.lessonId ?? null,
      topic: params.topic ?? null,
      minSimilarity: params.minSimilarity,
      topK: params.topK,
      count: params.items.length,
      chunks: params.items.map((c) => ({ id: c.id, similarity: c.similarity ?? null })),
    }),
  );
}

/**
 * After RPC, sort by similarity (desc) and keep rows at or above `min`.
 * If *none* pass the threshold but we have scored rows, still return the top-K by score
 * (best-effort); prompts use `|sim:` so the model can treat low matches as weak grounding
 * - better than discarding all chunks and leaving RAG empty.
 */
function selectBySimilarity(
  rows: RetrievedChunk[],
  topK: number,
  min: number,
): { picked: RetrievedChunk[]; allBelowMinSimilarity: boolean } {
  const sorted = [...rows].sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
  const haveScores = sorted.some((r) => r.similarity != null);
  if (!haveScores) {
    return { picked: sorted.slice(0, topK), allBelowMinSimilarity: false };
  }
  if (min <= 0) {
    return { picked: sorted.filter((r) => r.similarity != null).slice(0, topK), allBelowMinSimilarity: false };
  }
  const passed = sorted.filter((r) => (r.similarity ?? 0) >= min);
  if (passed.length > 0) {
    return { picked: passed.slice(0, topK), allBelowMinSimilarity: false };
  }
  if (sorted.length > 0) {
    return { picked: sorted.slice(0, topK), allBelowMinSimilarity: true };
  }
  return { picked: [], allBelowMinSimilarity: true };
}

function mapVectorRow(
  row: Record<string, unknown>,
): { id: string; lessonId?: string; topic?: string; text: string; similarity: number } {
  const sim = row.similarity;
  const s = typeof sim === "number" && !Number.isNaN(sim) ? sim : 0;
  return {
    id: String(row.id),
    lessonId: row.lesson_id ? String(row.lesson_id) : undefined,
    topic: row.topic ? String(row.topic) : undefined,
    text: String(row.chunk_text ?? ""),
    similarity: s,
  };
}

export type AiUserStatsSnapshot = {
  topicRollups: Array<{
    topic: string;
    totalAnswered: number;
    totalCorrect: number;
    avgResponseMs?: number;
  }>;
  adaptiveState: Array<{
    topic: string;
    currentLevel: number;
    recentAccuracy?: number;
  }>;
};

export type AiQuizSnapshot = {
  attemptId: string;
  scorePct?: number;
  questionCount: number;
  correctCount: number;
  weakTopics: string[];
};

export async function retrieveCourseChunks(
  client: SupabaseClient,
  params: RetrieveCourseChunksParams,
): Promise<RetrievedChunk[]> {
  // אחזור תוכן קורס תמיד עם service client כשזמין: RLS על course_content_chunks
  // מתיר קריאה רק ל-authenticated, ולכן session client לא-מחובר (dev/preview)
  // מחזיר בשקט 0 קטעים - לכל צרכני ה-AI (chat, quiz-review, recommendations,
  // coach). הגישה ל-routes עצמם מוגנת שם; כאן זה אינדקס תוכן, לא דאטת משתמש.
  const retrievalClient = getPrepSupabaseServiceClient() ?? client;
  const topK = clampRagTopK(params.topK);
  const min = getRagMinSimilarity(params.minSimilarity);
  const op = params.operation;
  const vectorText = buildVectorQueryText({
    query: params.query,
    questionContext: params.questionContext,
    lessonId: params.lessonId,
    topic: params.topic,
  });
  const hasVectorText = vectorText.trim().length > 0;

  if (hasVectorText || params.precomputedEmbedding) {
    try {
      const embedding = params.precomputedEmbedding ?? (await runEmbedding({ text: vectorText })).embedding;
      const matchCount = overfetchCount(topK);
      const { data, error } = await retrievalClient.rpc("match_course_content_chunks", {
        query_embedding: embedding,
        match_count: matchCount,
        filter_course_slug: "amirant-preparation",
        filter_lesson_id: params.lessonId?.trim() || null,
        filter_topic: params.topic?.trim() || null,
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const vectorRows: RetrievedChunk[] = (data as Array<Record<string, unknown>>)
          .map((row) => mapVectorRow(row))
          .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));

        const { picked, allBelowMinSimilarity } = selectBySimilarity(vectorRows, topK, min);
        const finalChunks = picked;

        logRagRetrieval({
          operation: op,
          lessonId: params.lessonId,
          topic: params.topic,
          minSimilarity: min,
          topK,
          items: finalChunks.map((c) => ({ id: c.id, similarity: c.similarity })),
        });

        if (allBelowMinSimilarity) {
          // eslint-disable-next-line no-console
          console.info(
            JSON.stringify({
              t: new Date().toISOString(),
              event: "rag_retrieval",
              subEvent: "best_effort_below_min_similarity",
              operation: op ?? "unknown",
              minSimilarity: min,
              topK,
            }),
          );
        }
        if (finalChunks.length > 0) {
          return finalChunks;
        }
      } else {
        // eslint-disable-next-line no-console
        console.info(
          JSON.stringify({
            t: new Date().toISOString(),
            event: "rag_retrieval_fallback",
            reason: error?.message ?? "no_vector_hits",
            operation: op ?? "unknown",
          }),
        );
      }
      return await textFallbackTable(client, params, topK, op, min);
    } catch {
      return await textFallbackTable(client, params, topK, op, min);
    }
  }

  // No embedding text: browse by lesson/topic
  return await textFallbackTable(client, params, topK, op, min);
}

async function textFallbackTable(
  client: SupabaseClient,
  params: RetrieveCourseChunksParams,
  topK: number,
  operation: string | undefined,
  _min: number,
): Promise<RetrievedChunk[]> {
  let q = client
    .from("course_content_chunks")
    .select("id, lesson_id, topic, chunk_text")
    .eq("course_slug", "amirant-preparation")
    .order("created_at", { ascending: false })
    .limit(topK);
  if (params.lessonId) q = q.eq("lesson_id", params.lessonId);
  if (params.topic) q = q.eq("topic", params.topic);
  const { data, error } = await q;
  if (error || !data) {
    logRagRetrieval({
      operation,
      lessonId: params.lessonId,
      topic: params.topic,
      minSimilarity: _min,
      topK,
      items: [],
    });
    return [];
  }
  const rows: RetrievedChunk[] = data.map((row) => ({
    id: String(row.id),
    lessonId: row.lesson_id ?? undefined,
    topic: row.topic ?? undefined,
    text: String(row.chunk_text ?? ""),
  }));
  logRagRetrieval({
    operation,
    lessonId: params.lessonId,
    topic: params.topic,
    minSimilarity: _min,
    topK,
    items: rows.map((c) => ({ id: c.id, similarity: undefined })),
  });
  return rows;
}

export async function loadAiUserStatsSnapshot(
  client: SupabaseClient,
  userId: string,
): Promise<AiUserStatsSnapshot> {
  const [rollupsRes, adaptiveRes] = await Promise.all([
    client
      .from("amirant_topic_rollups")
      .select("topic,total_answered,total_correct,avg_response_ms")
      .eq("user_id", userId),
    client
      .from("amirant_adaptive_state")
      .select("topic,current_level,recent_accuracy")
      .eq("user_id", userId),
  ]);

  const topicRollups = (rollupsRes.data ?? []).map((row) => ({
    topic: String(row.topic),
    totalAnswered: Number(row.total_answered ?? 0),
    totalCorrect: Number(row.total_correct ?? 0),
    avgResponseMs: row.avg_response_ms == null ? undefined : Number(row.avg_response_ms),
  }));

  const adaptiveState = (adaptiveRes.data ?? []).map((row) => ({
    topic: String(row.topic),
    currentLevel: Number(row.current_level ?? 3),
    recentAccuracy: row.recent_accuracy == null ? undefined : Number(row.recent_accuracy),
  }));

  return { topicRollups, adaptiveState };
}

export async function loadAiQuizSnapshot(
  client: SupabaseClient,
  userId: string,
  quizAttemptId?: string,
): Promise<AiQuizSnapshot | null> {
  let attemptQuery = client
    .from("amirant_quiz_attempts")
    .select("id,score_pct,question_count,correct_count")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1);

  if (quizAttemptId) {
    attemptQuery = client
      .from("amirant_quiz_attempts")
      .select("id,score_pct,question_count,correct_count")
      .eq("user_id", userId)
      .eq("id", quizAttemptId)
      .limit(1);
  }

  const { data: attempts, error } = await attemptQuery;
  if (error || !attempts || attempts.length === 0) return null;
  const attempt = attempts[0];

  const { data: answers } = await client
    .from("amirant_quiz_answers")
    .select("topic,is_correct")
    .eq("user_id", userId)
    .eq("attempt_id", attempt.id);

  const byTopic = new Map<string, { total: number; correct: number }>();
  for (const row of answers ?? []) {
    const topic = String(row.topic);
    const prev = byTopic.get(topic) ?? { total: 0, correct: 0 };
    prev.total += 1;
    if (row.is_correct === true) prev.correct += 1;
    byTopic.set(topic, prev);
  }

  const weakTopics = Array.from(byTopic.entries())
    .sort(
      (a, b) =>
        a[1].correct / Math.max(1, a[1].total) - b[1].correct / Math.max(1, b[1].total),
    )
    .slice(0, 3)
    .map(([topic]) => topic);

  return {
    attemptId: String(attempt.id),
    scorePct: attempt.score_pct == null ? undefined : Number(attempt.score_pct),
    questionCount: Number(attempt.question_count ?? 0),
    correctCount: Number(attempt.correct_count ?? 0),
    weakTopics,
  };
}
