import type { CourseId, LessonId, UserId } from "../domain";
import type { LearnerAdaptiveTopicState, SubtopicMasteryView } from "./adaptive-state.types";

/**
 * What the AI tutor MAY use - all read-only, already computed by platform code.
 * The model must not invent scores or completion; numbers here are copies for narration.
 */
export interface AiTutorGrounding {
  userId: UserId;
  courseId: CourseId;
  lessonId: LessonId | null;
  /** Chunk IDs or storage paths - RAG retrieval scope. */
  lessonContentRefs: string[];
  /** Snapshot of adaptive state per topic (no mutation by AI). */
  adaptiveByTopic: Record<string, Pick<LearnerAdaptiveTopicState, "currentLevel" | "totalAnswered" | "correctAnswered">>;
  /** Weak areas with explain strings (deterministic). */
  weakSubtopics: Pick<SubtopicMasteryView, "subtopicId" | "mastery" | "explain">[];
  /** Last quiz summary - authoritative values copied from DB, not recomputed by AI. */
  lastQuizAttemptSummary: {
    attemptId: string;
    scorePct: number;
    passed: boolean;
  } | null;
}

export type AiTutorIntent =
  | "explain_lesson"
  | "explain_wrong_answer"
  | "hint"
  | "practice_next"
  | "summarize_weak_areas";

/**
 * Bot output must never include authoritative claims outside this allow-list of fields
 * when echoing numbers - prefer quoting `grounding` payloads.
 */
export const AI_TUTOR_FORBIDDEN_CLAIMS = [
  "do not invent quiz scores or pass/fail",
  "do not change lesson completion status",
  "do not override correctness; explain using question + options from DB",
] as const;

export interface AiTutorRequest {
  intent: AiTutorIntent;
  grounding: AiTutorGrounding;
  /** User message - for RAG + safety only. */
  userMessage: string;
  /** Wrong-answer explanation: include stem + learner choice + correct key from server. */
  questionContext?: {
    questionId: string;
    stem: string;
    selectedLabel: string;
    correctLabel: string;
  };
}

export function mergeTutorRequest(
  grounding: AiTutorGrounding,
  rest: Omit<AiTutorRequest, "grounding">,
): AiTutorRequest {
  return { grounding, ...rest };
}
