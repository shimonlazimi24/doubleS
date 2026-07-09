import type { CourseId, TopicId, UserId } from "./domain";

/** One row per (user, course, topic) - updated by batch job or incremental worker. */
export interface LearnerTopicStats {
  userId: UserId;
  courseId: CourseId;
  topicId: TopicId;
  questionsAttempted: number;
  questionsCorrect: number;
  /** accuracy = questionsCorrect / questionsAttempted (0 if attempted === 0). */
  accuracy: number;
  /**
   * Confidence in [0,1] - Wilson score lower bound or Beta posterior (MVP: Wilson).
   * Prevents "100% weak" on n=1.
   */
  confidence: number;
  /** Linear regression slope of recent accuracy windows; optional. */
  trendSlope: number | null;
  lastPracticedAt: string | null;
  updatedAt: string;
}

export interface StudentProfilesSummary {
  userId: UserId;
  courseId: CourseId;
  lessonsCompleted: number;
  lessonsTotal: number;
  quizzesCompleted: number;
  avgQuizScorePct: number | null;
  timeOnTaskMinutesEst: number;
  weakTopicIds: TopicId[];
  strongTopicIds: TopicId[];
  lastComputedAt: string;
}

// --- Formulas (deterministic; same inputs → same outputs) ---

export function completionRate(lessonsCompleted: number, lessonsTotal: number): number {
  if (lessonsTotal <= 0) return 0;
  return lessonsCompleted / lessonsTotal;
}

export function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Wilson score interval lower bound for binomial proportion - stabilizes small n. */
export function wilsonLowerBound(correct: number, total: number, z = 1.96): number {
  if (total <= 0) return 0;
  const p = correct / total;
  const denom = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return Math.max(0, (center - margin) / denom);
}

export function accuracyRatio(correct: number, attempted: number): number {
  if (attempted <= 0) return 0;
  return correct / attempted;
}

export interface WeakTopicThresholds {
  /** Min attempts before a topic can be labeled weak (avoid noise). */
  minAttempts: number;
  /** Wilson lower bound below this → candidate weak. */
  maxWilsonLower: number;
}

export const DEFAULT_WEAK_THRESHOLDS: WeakTopicThresholds = {
  minAttempts: 5,
  maxWilsonLower: 0.55,
};

export interface StrongTopicThresholds {
  minAttempts: number;
  minWilsonLower: number;
}

export const DEFAULT_STRONG_THRESHOLDS: StrongTopicThresholds = {
  minAttempts: 5,
  minWilsonLower: 0.78,
};

/**
 * Weak topics: deterministic from learner_topic_stats only.
 * A topic is "weak" iff attempts ≥ minAttempts and Wilson LB < maxWilsonLower.
 */
export function isWeakTopic(
  stats: Pick<LearnerTopicStats, "questionsAttempted" | "questionsCorrect">,
  t: WeakTopicThresholds = DEFAULT_WEAK_THRESHOLDS,
): boolean {
  if (stats.questionsAttempted < t.minAttempts) return false;
  const w = wilsonLowerBound(stats.questionsCorrect, stats.questionsAttempted);
  return w < t.maxWilsonLower;
}

export function isStrongTopic(
  stats: Pick<LearnerTopicStats, "questionsAttempted" | "questionsCorrect">,
  t: StrongTopicThresholds = DEFAULT_STRONG_THRESHOLDS,
): boolean {
  if (stats.questionsAttempted < t.minAttempts) return false;
  const w = wilsonLowerBound(stats.questionsCorrect, stats.questionsAttempted);
  return w >= t.minWilsonLower;
}

/**
 * Improvement over time: compare mean score in first half vs second half of attempts (by time).
 * Implemented in SQL/job; here - pure function on ordered scores.
 */
export function improvementDeltaScores(orderedScores: number[]): number | null {
  if (orderedScores.length < 4) return null;
  const mid = Math.floor(orderedScores.length / 2);
  const first = orderedScores.slice(0, mid);
  const second = orderedScores.slice(mid);
  const a1 = averageScore(first);
  const a2 = averageScore(second);
  if (a1 === null || a2 === null) return null;
  return a2 - a1;
}
