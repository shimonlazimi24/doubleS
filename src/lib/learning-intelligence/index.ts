export * from "./adaptive";
export * from "./boundaries";
export * from "./domain";
export * from "./events";
export * from "./analytics";
export * from "./personalization";
export * from "./ai-layer";
export * from "./flows";
export {
  createLearningService,
  type LearningService,
} from "./learning-service";
export type {
  EmitEventInput,
  EmitEventResult,
  LessonProgressSnapshot,
  MarkLessonCompletedInput,
  MarkLessonStartedInput,
  ServiceError,
  ServiceResult,
  StartQuizAttemptInput,
  StartQuizAttemptResult,
  SubmitAnswerInput,
  SubmitAnswerResult,
  SubmitQuizInput,
  SubmitQuizResult,
} from "./learning-service.types";
