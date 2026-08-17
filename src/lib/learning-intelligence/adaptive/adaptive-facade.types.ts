/**
 * Service layer boundaries - adaptive logic stays pure; facade orchestrates DB.
 */

import type { CourseId, QuestionId, TopicId, UserId } from "../domain";
import type {
  LearnerAdaptiveTopicState,
  NextQuestionSelection,
  QuestionPoolItem,
  SubtopicMasteryView,
} from "./adaptive-state.types";
import type { AiTutorGrounding } from "./ai-tutor-contract";

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface RecordAdaptivePracticeAnswerInput {
  userId: UserId;
  courseId: CourseId;
  topicId: TopicId;
  subtopicId: string | null;
  questionId: QuestionId;
  isCorrect: boolean;
  responseTimeSeconds: number;
  /** Current question pool for next selection (loaded by caller). */
  pool: QuestionPoolItem[];
}

export interface RecordAdaptivePracticeAnswerResult {
  updatedState: LearnerAdaptiveTopicState;
  next: NextQuestionSelection | null;
}

export interface GetWeakAreasInput {
  userId: UserId;
  courseId: CourseId;
}

/**
 * Facade - single entry for adaptive engines + tutor context assembly.
 * Not wired in product yet; keep types for future orchestration.
 */
export interface AdaptiveLearningFacade {
  recordPracticeAnswer(input: RecordAdaptivePracticeAnswerInput): Promise<ServiceResult<RecordAdaptivePracticeAnswerResult>>;
  getWeakSubtopics(input: GetWeakAreasInput): Promise<ServiceResult<SubtopicMasteryView[]>>;
  buildTutorGrounding(input: { userId: UserId; courseId: CourseId; lessonId: string | null }): Promise<AiTutorGrounding>;
}
