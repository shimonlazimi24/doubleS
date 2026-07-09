import { z } from "zod";
import type {
  AttemptId,
  CourseId,
  EventVersion,
  LessonId,
  ModuleId,
  QuestionId,
  QuizId,
  UserId,
} from "./domain";

// ---------------------------------------------------------------------------
// Zod schemas - strict metadata per eventType (single source of truth)
// ---------------------------------------------------------------------------

const lessonStarted = z
  .object({
    source: z.string().optional(),
  })
  .strict();

const lessonCompleted = z
  .object({
    completionMethod: z.enum(["manual", "video", "quiz"]).optional(),
  })
  .strict();

const videoStarted = z
  .object({
    videoId: z.string().min(1),
    source: z.string().optional(),
  })
  .strict();

const videoProgressed = z
  .object({
    videoId: z.string().min(1),
    currentTimeSeconds: z.number().nonnegative(),
    watchPercent: z.number().min(0).max(100),
  })
  .strict();

const videoCompleted = z
  .object({
    videoId: z.string().min(1),
    watchPercent: z.number().min(0).max(100),
  })
  .strict();

const quizStarted = z
  .object({
    quizId: z.string().min(1),
    mode: z.enum(["practice", "exam"]).optional(),
  })
  .strict();

const questionAnswered = z
  .object({
    questionId: z.string().min(1),
    topic: z.string().min(1),
    subtopic: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    selectedOptionId: z.string().optional(),
    isCorrect: z.boolean(),
    responseTimeSeconds: z.number().nonnegative(),
  })
  .strict();

const answerCorrect = z
  .object({
    questionId: z.string().min(1),
    topic: z.string().min(1),
    responseTimeSeconds: z.number().nonnegative().optional(),
  })
  .strict();

const answerWrong = z
  .object({
    questionId: z.string().min(1),
    topic: z.string().min(1),
    responseTimeSeconds: z.number().nonnegative().optional(),
  })
  .strict();

const quizSubmitted = z
  .object({
    quizId: z.string().min(1),
    attemptId: z.string().min(1),
    scorePercent: z.number().min(0).max(100),
    correctCount: z.number().int().nonnegative(),
    totalCount: z.number().int().positive(),
    timeSpentSeconds: z.number().nonnegative().optional(),
  })
  .strict()
  .refine((d) => d.correctCount <= d.totalCount, {
    message: "correctCount cannot exceed totalCount",
  });

const aiChatOpened = z
  .object({
    lessonId: z.string().optional(),
    threadId: z.string().optional(),
  })
  .strict();

const aiQuestionAsked = z
  .object({
    lessonId: z.string().optional(),
    threadId: z.string().optional(),
    promptLength: z.number().int().nonnegative().optional(),
  })
  .strict();

const recommendationClicked = z
  .object({
    recommendationId: z.string().min(1),
    recommendationType: z.string().min(1),
  })
  .strict();

/**
 * Central map: every `LearningEventType` must have exactly one schema.
 * Bump `eventVersion` in DB when any schema shape changes incompatibly.
 */
export const LEARNING_EVENT_METADATA_SCHEMAS = {
  lesson_started: lessonStarted,
  lesson_completed: lessonCompleted,
  video_started: videoStarted,
  video_progressed: videoProgressed,
  video_completed: videoCompleted,
  quiz_started: quizStarted,
  question_answered: questionAnswered,
  answer_correct: answerCorrect,
  answer_wrong: answerWrong,
  quiz_submitted: quizSubmitted,
  ai_chat_opened: aiChatOpened,
  ai_question_asked: aiQuestionAsked,
  recommendation_clicked: recommendationClicked,
} as const;

export type LearningEventType = keyof typeof LEARNING_EVENT_METADATA_SCHEMAS;

/** Runtime list (for validation, selects, migrations). */
export const LEARNING_EVENT_TYPES = Object.keys(
  LEARNING_EVENT_METADATA_SCHEMAS,
) as LearningEventType[];

export type LearningEventMetadataByType = {
  [K in LearningEventType]: z.infer<(typeof LEARNING_EVENT_METADATA_SCHEMAS)[K]>;
};

/** Union of all valid metadata payloads. */
export type LearningEventMetadata = LearningEventMetadataByType[LearningEventType];

export type ValidateMetadataSuccess<T extends LearningEventType> = {
  success: true;
  data: LearningEventMetadataByType[T];
};

export type ValidateMetadataFailure = {
  success: false;
  error: z.ZodError;
};

export type ValidateMetadataResult<T extends LearningEventType> =
  | ValidateMetadataSuccess<T>
  | ValidateMetadataFailure;

/**
 * Validates `metadata` for a concrete `eventType`. Use before any insert into `learning_events`.
 */
export function validateLearningEventMetadata<T extends LearningEventType>(
  eventType: T,
  metadata: unknown,
): ValidateMetadataResult<T> {
  const schema = LEARNING_EVENT_METADATA_SCHEMAS[eventType];
  const parsed = schema.safeParse(metadata);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  return { success: true, data: parsed.data as LearningEventMetadataByType[T] };
}

// ---------------------------------------------------------------------------
// Envelope builder - metadata must pass Zod or the operation fails
// ---------------------------------------------------------------------------

export type CreateLearningEventEnvelopeInput = {
  userId: UserId;
  eventType: LearningEventType;
  /** Defaults to 1; bump when breaking schema change for this event family. */
  eventVersion?: EventVersion;
  courseId: CourseId | null;
  moduleId: ModuleId | null;
  lessonId: LessonId | null;
  quizId: QuizId | null;
  attemptId: AttemptId | null;
  questionId: QuestionId | null;
  metadata: unknown;
  clientOccurredAt?: string | null;
  dedupeKey?: string | null;
  /** Defaults to `crypto.randomUUID()` when omitted (Node / modern browsers). */
  id?: string;
  /** ISO string; defaults to `new Date().toISOString()` when omitted. */
  createdAt?: string;
};

export type LearningEventEnvelopeValidated = {
  id: string;
  userId: UserId;
  eventType: LearningEventType;
  eventVersion: EventVersion;
  courseId: CourseId | null;
  moduleId: ModuleId | null;
  lessonId: LessonId | null;
  quizId: QuizId | null;
  attemptId: AttemptId | null;
  questionId: QuestionId | null;
  metadata: LearningEventMetadata;
  clientOccurredAt: string | null;
  createdAt: string;
  dedupeKey: string | null;
};

export type CreateLearningEventEnvelopeResult =
  | { success: true; envelope: LearningEventEnvelopeValidated }
  | { success: false; error: z.ZodError };

/**
 * Builds a row-shaped envelope with **validated** metadata. Callers must persist only on `success`.
 */
export function createLearningEventEnvelope(
  input: CreateLearningEventEnvelopeInput,
): CreateLearningEventEnvelopeResult {
  const checked = validateLearningEventMetadata(input.eventType, input.metadata);
  if (!checked.success) {
    return checked;
  }

  const id = input.id ?? crypto.randomUUID();
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    success: true,
    envelope: {
      id,
      userId: input.userId,
      eventType: input.eventType,
      eventVersion: input.eventVersion ?? 1,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      quizId: input.quizId,
      attemptId: input.attemptId,
      questionId: input.questionId,
      metadata: checked.data,
      clientOccurredAt: input.clientOccurredAt ?? null,
      createdAt,
      dedupeKey: input.dedupeKey ?? null,
    },
  };
}
