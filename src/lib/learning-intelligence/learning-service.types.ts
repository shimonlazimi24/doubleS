import type { z } from "zod";
import type { AttemptId, LessonId, QuestionId, QuizId, UserId } from "./domain";
import type { CreateLearningEventEnvelopeInput } from "./learning-event-metadata";

/** Discriminated result for service methods — no thrown errors for expected failures. */
export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ServiceError };

export type ServiceErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "DB_ERROR"
  | "EVENT_VALIDATION";

export type ServiceError = {
  code: ServiceErrorCode;
  message: string;
  cause?: unknown;
  zodError?: z.ZodError;
};

// --- Inputs (validated with Zod in service entrypoints) ---

export type StartQuizAttemptInput = {
  userId: UserId;
  quizId: QuizId;
  mode?: "practice" | "exam";
};

export type SubmitAnswerInput = {
  userId: UserId;
  attemptId: AttemptId;
  questionId: QuestionId;
  /** Missing or invalid selection is scored as incorrect server-side. */
  selectedOptionId: string | null;
  responseTimeSeconds: number;
};

export type SubmitQuizInput = {
  userId: UserId;
  attemptId: AttemptId;
  timeSpentSeconds?: number;
};

export type MarkLessonStartedInput = {
  userId: UserId;
  lessonId: LessonId;
  source?: string;
};

export type MarkLessonCompletedInput = {
  userId: UserId;
  lessonId: LessonId;
  completionMethod?: "manual" | "video" | "quiz";
};

/** Pass-through to Zod envelope; metadata validated inside `emitEvent`. */
export type EmitEventInput = Omit<CreateLearningEventEnvelopeInput, "id" | "createdAt">;

// --- Outputs ---

export type StartQuizAttemptResult = {
  attemptId: AttemptId;
  quizId: QuizId;
  startedAt: string;
};

export type SubmitAnswerResult = {
  answerId: string;
  attemptId: AttemptId;
  questionId: QuestionId;
  isCorrect: boolean;
};

export type SubmitQuizResult = {
  attemptId: AttemptId;
  quizId: QuizId;
  scorePct: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
};

export type LessonProgressSnapshot = {
  lessonId: LessonId;
  status: "not_started" | "in_progress" | "completed";
  completedAt: string | null;
  updatedAt: string;
};

export type EmitEventResult = {
  eventId: string;
};
