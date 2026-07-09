/**
 * Layer boundaries - single source of truth for what may read/write what.
 *
 * Course Engine: authoritative for content, enrollments, lesson_progress, quiz_attempts,
 *                quiz_attempt_answers, and all deterministic scoring.
 * Events Layer:  append-only facts; mirrors domain writes for analytics pipelines.
 * Analytics:     derived tables only (learner_topic_stats, student_profiles_summary).
 * AI Layer:       ai_artifacts + ephemeral chat; never mutates scores or progress.
 * Personalization: reads analytics + engine state; outputs recommendations (optional cache).
 */

export const AUTHORITATIVE_SCORE_SOURCES = [
  "quiz_attempts.score_pct",
  "quiz_attempt_answers.is_correct",
  "lesson_progress.status",
] as const;
