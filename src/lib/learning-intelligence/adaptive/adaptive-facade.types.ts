/**
 * Service layer boundaries — implement with Supabase in a dedicated module later.
 * Keeps adaptive logic pure in sibling files; facade orchestrates DB + events.
 */

import type { CourseId, QuestionId, TopicId, UserId } from "../domain";
import type { ServiceResult } from "../learning-service.types";
import type {
  LearnerAdaptiveTopicState,
  NextQuestionSelection,
  QuestionPoolItem,
  SubtopicMasteryView,
} from "./adaptive-state.types";
import type { AiTutorGrounding } from "./ai-tutor-contract";

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
 * Facade — single entry for adaptive engines + tutor context assembly.
 * Implementation: load/save rows in `learner_adaptive_topic_state`, `learner_subtopic_stats`,
 * emit `learning_events` via `LearningService.emitEvent` where appropriate.
 */
export interface AdaptiveLearningFacade {
  recordPracticeAnswer(input: RecordAdaptivePracticeAnswerInput): Promise<ServiceResult<RecordAdaptivePracticeAnswerResult>>;
  getWeakSubtopics(input: GetWeakAreasInput): Promise<ServiceResult<SubtopicMasteryView[]>>;
  buildTutorGrounding(input: { userId: UserId; courseId: CourseId; lessonId: string | null }): Promise<AiTutorGrounding>;
}
