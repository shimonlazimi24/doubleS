import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import {
  generateWeakQuizRequestSchema,
  generateWeakTopicsQuiz,
} from "@/lib/amirant-course/weak-quiz";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";

async function loadRecentQuestionIds(userId: string): Promise<string[]> {
  const client = createPrepSupabaseServerClient();
  if (!client) return [];

  const { data, error } = await client
    .from("amirant_quiz_answers")
    .select("question_id,answered_at")
    .eq("user_id", userId)
    .order("answered_at", { ascending: false })
    .limit(120);

  if (error || !data) return [];

  const seen = new Set<string>();
  for (const row of data) {
    if (typeof row.question_id === "string" && row.question_id.length > 0) {
      seen.add(row.question_id);
    }
    if (seen.size >= 80) break;
  }
  return Array.from(seen);
}

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await checkAiRouteRateLimit({ key: user.id, route: "generate-weak-quiz" }))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = generateWeakQuizRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (parsed.data.userId !== user.id) {
    return NextResponse.json(
      { error: "userId does not match authenticated user" },
      { status: 403 },
    );
  }

  const recentQuestionIds = await loadRecentQuestionIds(user.id);
  const result = generateWeakTopicsQuiz({
    input: parsed.data,
    recentQuestionIds,
  });

  const now = new Date().toISOString();
  await client.from("amirant_learning_events").insert({
    user_id: user.id,
    event_type: "adaptive_decision",
    metadata: {
      source: "weak_topic_quiz_generation",
      sessionId: `weak-quiz-${now}`,
      topicSelection: result.topics,
      difficultyDistribution: result.difficultyDistribution,
      selectedQuestions: result.questionIds,
      userId: user.id,
      previousLevel:
        parsed.data.adaptive_state[0]?.currentLevel ?? null,
      selectedLevel:
        Object.keys(result.difficultyDistribution)[0] ?? null,
      topic: result.topics[0] ?? null,
      questionId: result.questionIds[0] ?? null,
      reason: "weak_topic_quiz_generation",
      streak: {
        correct: 0,
        wrong: 0,
      },
      recentAccuracy:
        parsed.data.learner_topic_stats[0]?.accuracy ?? null,
      timestamp: now,
    },
  });

  return NextResponse.json(result);
}
