import type { SupabaseClient } from "@supabase/supabase-js";
import { AMIRANT_BANK_QUESTIONS } from "./question-bank";
import { AMIRANT_PREPARATION_MANIFEST } from "./manifest";
import type { AmirantBankTopicSlug } from "./types/bank-question";
import { AMIRANT_TOPIC_LABEL_HE } from "./topic-labels";
import { PREP_BASE } from "@/lib/prep/constants";
import {
  buildWeakestTopicPractice,
  computeNextBestAction,
  defaultFirstSimulation,
  getCourseProgressMeta,
  getFirstIncompleteLesson,
  withNextBestActionEnrichment,
} from "./next-best-action";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { loadSupabaseAmirantProgressState } from "./progress";
import type { NextBestActionEnriched } from "./next-best-action";

const TOPICS: AmirantBankTopicSlug[] = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
];

type TopicScore = {
  topic: AmirantBankTopicSlug;
  topicLabel: string;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
};

export type DashboardSeriesPoint = {
  label: string;
  accuracyPct: number;
  avgResponseMs: number;
};

export type StudentDashboardData = {
  weakTopics: TopicScore[];
  strongTopics: TopicScore[];
  currentLevelByTopic: Array<{
    topic: AmirantBankTopicSlug;
    topicLabel: string;
    level: number;
    recentAccuracy: number | null;
  }>;
  recommendedNextAction: NextBestActionEnriched;
  accuracyOverTime: DashboardSeriesPoint[];
  timePerQuestionTrend: DashboardSeriesPoint[];
  recentQuizAttempts: Array<{
    attemptId: string;
    quizId: string;
    submittedAt: string | null;
    scorePct: number | null;
  }>;
};

export type QuizMistakeRow = {
  questionId: string;
  topic: AmirantBankTopicSlug;
  topicLabel: string;
  prompt: string;
  selectedOptionLabel: string;
  correctOptionLabel: string;
  explanation: string;
  lessonHref: string | null;
  practiceHref: string | null;
};

export type QuizReviewData = {
  attemptId: string;
  quizId: string;
  submittedAt: string | null;
  scorePct: number | null;
  mistakesByTopic: Array<{
    topic: AmirantBankTopicSlug;
    topicLabel: string;
    mistakes: QuizMistakeRow[];
  }>;
};

type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  submitted_at: string | null;
  score_pct: number | null;
};

type QuizAnswerRow = {
  attempt_id: string;
  question_id: string;
  topic: string;
  selected_option_id: string | null;
  correct_option_id: string;
  is_correct: boolean;
  response_time_ms: number | null;
};

function normalizeTopic(topic: string): AmirantBankTopicSlug | null {
  const x = topic.trim().toLowerCase();
  if (x === "vocabulary") return "vocabulary";
  if (x === "sentence_completion") return "sentence_completion";
  if (x === "rephrasing") return "rephrasing";
  if (x === "reading_comprehension") return "reading_comprehension";
  return null;
}

function topicModuleSlug(topic: AmirantBankTopicSlug): string {
  if (topic === "vocabulary") return "vocabulary";
  if (topic === "sentence_completion") return "sentence-completion";
  if (topic === "rephrasing") return "sentence-rephrasing";
  return "reading-comprehension";
}

function topicDeepLinks(topic: AmirantBankTopicSlug): {
  lessonHref: string | null;
  practiceHref: string | null;
} {
  const moduleSlug = topicModuleSlug(topic);
  const courseModule = AMIRANT_PREPARATION_MANIFEST.modules.find(
    (row) => row.slug === moduleSlug,
  );
  const lessonId = courseModule?.lessons[0]?.id;
  const practiceSetId = courseModule?.practiceSets[0]?.id;
  return {
    lessonHref: lessonId
      ? `${PREP_BASE}/amirant/course/lesson/${lessonId}`
      : null,
    practiceHref: practiceSetId
      ? `${PREP_BASE}/amirant/course/practice/${practiceSetId}`
      : null,
  };
}

function formatAttemptLabel(value: string | null): string {
  if (!value) return "לא נשלח";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("he-IL", { month: "numeric", day: "numeric" });
}

export async function loadStudentDashboardData(
  client: SupabaseClient,
  userId: string,
): Promise<StudentDashboardData> {
  const COURSE_HREF = `${PREP_BASE}/amirant/course`;
  // One batch, not a chain. Every query below depends only on the user id, so
  // running them in sequence multiplied the round trip to the database by five.
  const [
    { data: rollups },
    { data: adaptive },
    { data: attempts },
    { count: simCount, error: simErr },
    progress,
    hasFullAccess,
  ] = await Promise.all([
      client
        .from("amirant_topic_rollups")
        .select("topic,total_answered,total_correct")
        .eq("user_id", userId),
      client
        .from("amirant_adaptive_state")
        .select("topic,current_level,recent_accuracy")
        .eq("user_id", userId),
      client
        .from("amirant_quiz_attempts")
        .select("id,quiz_id,submitted_at,score_pct")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: true })
        .limit(30),
      client
        .from("amirant_simulation_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      loadSupabaseAmirantProgressState(client, userId),
      hasAmirantFullAccess(client, userId),
    ]);

  const topicScores: TopicScore[] = TOPICS.map((topic) => {
    const roll = (rollups ?? []).find((row) => row.topic === topic);
    const totalAnswered = Number(roll?.total_answered ?? 0);
    const totalCorrect = Number(roll?.total_correct ?? 0);
    return {
      topic,
      topicLabel: AMIRANT_TOPIC_LABEL_HE[topic],
      totalAnswered,
      totalCorrect,
      accuracy: totalAnswered > 0 ? totalCorrect / totalAnswered : 0,
    };
  });

  const withAttempts = topicScores.filter((row) => row.totalAnswered > 0);
  const weakTopics = [...withAttempts]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
  const strongTopics = [...withAttempts]
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3);

  const currentLevelByTopic = TOPICS.map((topic) => {
    const row = (adaptive ?? []).find((x) => x.topic === topic);
    return {
      topic,
      topicLabel: AMIRANT_TOPIC_LABEL_HE[topic],
      level: Number(row?.current_level ?? 3),
      recentAccuracy:
        row?.recent_accuracy == null ? null : Number(row.recent_accuracy),
    };
  });

  const attemptRows = (attempts ?? []) as QuizAttemptRow[];
  const attemptIds = attemptRows.map((row) => row.id);
  const latestAttemptRow = attemptRows[attemptRows.length - 1] ?? null;

  // Both of these need only the attempt list, so they go together rather than
  // one after the other.
  const [{ data: answerRows }, mistakeCountResult] = await Promise.all([
    attemptIds.length
      ? client
          .from("amirant_quiz_answers")
          .select("attempt_id,response_time_ms,is_correct")
          .eq("user_id", userId)
          .in("attempt_id", attemptIds)
      : Promise.resolve({ data: [] as QuizAnswerRow[] }),
    latestAttemptRow
      ? client
          .from("amirant_quiz_answers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("attempt_id", latestAttemptRow.id)
          .eq("is_correct", false)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  const answersByAttempt = new Map<
    string,
    Array<{ responseTimeMs: number; isCorrect: boolean }>
  >();
  for (const row of (answerRows ?? []) as QuizAnswerRow[]) {
    const list = answersByAttempt.get(row.attempt_id) ?? [];
    list.push({
      responseTimeMs: Number(row.response_time_ms ?? 0),
      isCorrect: row.is_correct === true,
    });
    answersByAttempt.set(row.attempt_id, list);
  }

  const accuracyOverTime: DashboardSeriesPoint[] = attemptRows.map((row) => {
    const ans = answersByAttempt.get(row.id) ?? [];
    const total = ans.length;
    const correct = ans.filter((x) => x.isCorrect).length;
    const avgResponseMs =
      total > 0
        ? Math.round(ans.reduce((sum, x) => sum + x.responseTimeMs, 0) / total)
        : 0;
    const accuracyPct =
      row.score_pct != null
        ? Number(row.score_pct)
        : total > 0
          ? Math.round((correct / total) * 100)
          : 0;
    return {
      label: formatAttemptLabel(row.submitted_at),
      accuracyPct,
      avgResponseMs,
    };
  });

  const timePerQuestionTrend = [...accuracyOverTime];

  const latestAttempt = latestAttemptRow;
  const lastQuizMistakes = mistakeCountResult.error ? 0 : (mistakeCountResult.count ?? 0);

  const nbaRows = topicScores.map((r) => ({
    topic: r.topic,
    totalAnswered: r.totalAnswered,
    totalCorrect: r.totalCorrect,
  }));
  const weakNba = weakTopics.map((r) => ({
    topic: r.topic,
    totalAnswered: r.totalAnswered,
    totalCorrect: r.totalCorrect,
  }));
  const { percent: progressPct } = getCourseProgressMeta(progress);
  const firstIncomplete = getFirstIncompleteLesson(progress, COURSE_HREF);
  const firstSim = defaultFirstSimulation(COURSE_HREF);
  const nbaContext = {
    courseBase: COURSE_HREF,
    weakTopics: nbaRows,
    lessonProgressPercent: progressPct,
    quizAttemptCount: attemptRows.length,
    submittedSimulationCount: !simErr && simCount != null ? simCount : 0,
    sessionQuizCount: attemptRows.length,
    lastQuiz: latestAttempt
      ? {
          attemptId: latestAttempt.id,
          mistakeCount: lastQuizMistakes,
          submittedAt: latestAttempt.submitted_at,
        }
      : null,
    firstIncompleteLesson: firstIncomplete,
    firstSimulation: firstSim,
    weakestTopicPractice: buildWeakestTopicPractice(weakNba.length ? weakNba : nbaRows, COURSE_HREF),
  };
  // הזכאות האמיתית (course_entitlements) - לא דגל env: משלם לא יקבל CTA לתשלום.
  // נטענה למעלה יחד עם שאר הקריאות.
  const recommendedNextAction: NextBestActionEnriched = withNextBestActionEnrichment(
    computeNextBestAction(nbaContext),
    nbaContext,
    { hasFullAccess },
  );

  const recentQuizAttempts = [...attemptRows]
    .reverse()
    .slice(0, 8)
    .map((row) => ({
      attemptId: row.id,
      quizId: row.quiz_id,
      submittedAt: row.submitted_at,
      scorePct: row.score_pct == null ? null : Number(row.score_pct),
    }));

  return {
    weakTopics,
    strongTopics,
    currentLevelByTopic,
    recommendedNextAction,
    accuracyOverTime,
    timePerQuestionTrend,
    recentQuizAttempts,
  };
}

export async function loadQuizReviewData(
  client: SupabaseClient,
  userId: string,
  attemptId: string,
): Promise<QuizReviewData | null> {
  const { data: attempts } = await client
    .from("amirant_quiz_attempts")
    .select("id,quiz_id,submitted_at,score_pct")
    .eq("user_id", userId)
    .eq("id", attemptId)
    .limit(1);
  const attempt = (attempts?.[0] as QuizAttemptRow | undefined) ?? null;
  if (!attempt) return null;

  const { data: answers } = await client
    .from("amirant_quiz_answers")
    .select(
      "attempt_id,question_id,topic,selected_option_id,correct_option_id,is_correct,response_time_ms",
    )
    .eq("user_id", userId)
    .eq("attempt_id", attemptId);

  const byTopic = new Map<AmirantBankTopicSlug, QuizMistakeRow[]>();
  const bankById = new Map(AMIRANT_BANK_QUESTIONS.map((q) => [q.id, q]));

  for (const row of (answers ?? []) as QuizAnswerRow[]) {
    if (row.is_correct) continue;
    const topic = normalizeTopic(String(row.topic));
    if (!topic) continue;
    const q = bankById.get(String(row.question_id));
    if (!q) continue;
    const selectedOptionLabel =
      q.options.find((opt) => opt.id === row.selected_option_id)?.label ??
      "לא נבחרה תשובה";
    const correctOptionLabel =
      q.options.find((opt) => opt.id === row.correct_option_id)?.label ??
      row.correct_option_id;
    const links = topicDeepLinks(topic);
    const list = byTopic.get(topic) ?? [];
    list.push({
      questionId: q.id,
      topic,
      topicLabel: AMIRANT_TOPIC_LABEL_HE[topic],
      prompt: q.prompt,
      selectedOptionLabel,
      correctOptionLabel,
      explanation: q.explanation,
      lessonHref: links.lessonHref,
      practiceHref: links.practiceHref,
    });
    byTopic.set(topic, list);
  }

  const mistakesByTopic = Array.from(byTopic.entries()).map(([topic, mistakes]) => ({
    topic,
    topicLabel: AMIRANT_TOPIC_LABEL_HE[topic],
    mistakes,
  }));

  mistakesByTopic.sort((a, b) => b.mistakes.length - a.mistakes.length);

  return {
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    submittedAt: attempt.submitted_at,
    scorePct: attempt.score_pct == null ? null : Number(attempt.score_pct),
    mistakesByTopic,
  };
}
