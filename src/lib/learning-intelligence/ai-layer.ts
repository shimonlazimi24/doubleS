import type { AttemptId, CourseId, LessonId, QuizId, TopicId, UserId } from "./domain";

/**
 * AI may ONLY produce artifacts — never mutate authoritative tables.
 * All outputs reference input_refs (chunk ids, lesson version, analytics snapshot ids).
 */

export type AiArtifactKind =
  | "tutor_message"
  | "quiz_explanation"
  | "weak_topic_summary"
  | "coach_summary"
  | "recommendation_copy";

export interface AiInputRef {
  type: "lesson_chunk" | "analytics_snapshot" | "attempt_question" | "policy";
  id: string;
}

/** Structured outputs — validate with zod at runtime in API route. */
export interface QuizExplanationOutput {
  kind: "quiz_explanation";
  questionId: string;
  /** Grounded in course explanation + RAG chunks; may not contradict isCorrect. */
  sections: { title: string; body: string; sourceChunkIds: string[] }[];
}

export interface WeakTopicSummaryOutput {
  kind: "weak_topic_summary";
  topicId: TopicId;
  summary: string;
  suggestedDrills: string[];
  /** Must cite learner_topic_stats snapshot id in input_refs. */
  basedOnStatsRef: string;
}

export interface CoachSummaryOutput {
  kind: "coach_summary";
  periodLabel: string;
  highlights: string[];
  nextSteps: string[];
  /** Numbers must copy from analytics payload — not invented. */
  statsEcho: {
    completionRate: number;
    avgQuizScore: number | null;
    weakTopicLabels: string[];
  };
}

export interface AiArtifactRecord {
  id: string;
  userId: UserId;
  courseId: CourseId;
  kind: AiArtifactKind;
  lessonId: LessonId | null;
  quizId: QuizId | null;
  attemptId: AttemptId | null;
  model: string;
  promptHash: string | null;
  inputRefs: AiInputRef[];
  output: QuizExplanationOutput | WeakTopicSummaryOutput | CoachSummaryOutput | Record<string, unknown>;
  outputSchemaVersion: number;
  createdAt: string;
}
