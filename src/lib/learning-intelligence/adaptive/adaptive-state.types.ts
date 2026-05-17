import type { CourseId, QuestionId, TopicId, UserId } from "../domain";

/** Difficulty label on content; numeric 1 (easiest) .. 6 (hardest). */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Authoritative adaptive row shape — mirrors `learner_adaptive_topic_state`. */
export interface LearnerAdaptiveTopicState {
  userId: UserId;
  courseId: CourseId;
  topicId: TopicId;
  currentLevel: DifficultyLevel;
  correctStreak: number;
  wrongStreak: number;
  totalAnswered: number;
  correctAnswered: number;
  /** Oldest-first; app caps length (e.g. 10). */
  recentOutcomes: boolean[];
  /** Sum of response times for rolling average. */
  sumResponseTimeSec: number;
  lastAnsweredAt: string | null;
  updatedAt: string;
}

/** Derived read model (computed in code, not stored as source of truth). */
export interface AdaptiveTopicDerived {
  recentAccuracy: number;
  /** Wilson lower bound on topic-level correctness — aligns with analytics. */
  confidence: number;
  averageResponseTimeSec: number | null;
}

export interface LearnerSubtopicStatsRow {
  userId: UserId;
  courseId: CourseId;
  topicId: TopicId;
  subtopicId: string;
  totalAnswered: number;
  correctAnswered: number;
  wrongAnswered: number;
  sumResponseTimeSec: number;
  lastAnsweredAt: string | null;
}

export type MasteryStatus = "weak" | "neutral" | "strong";

export interface SubtopicMasteryView extends LearnerSubtopicStatsRow {
  accuracy: number;
  averageResponseTimeSec: number | null;
  wilsonLowerBound: number;
  mastery: MasteryStatus;
  /** Human-readable for tutor / UI (not shown to end user as “truth”). */
  explain: string;
}

/** Pool row for selection — minimal fields from `quiz_questions` + joins. */
export interface QuestionPoolItem {
  questionId: QuestionId;
  topicId: TopicId;
  subtopicId: string | null;
  difficultyLevel: DifficultyLevel;
}

export interface NextQuestionSelection {
  questionId: QuestionId;
  /** Level of the chosen question (may differ after fallback). */
  usedDifficultyLevel: DifficultyLevel;
  /** Why this level was chosen (debug / analytics). */
  reason: string;
}
