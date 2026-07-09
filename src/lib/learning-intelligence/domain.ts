/** Branded IDs - use across services without mixing entity types. */
export type UserId = string;
export type CourseId = string;
export type ModuleId = string;
export type LessonId = string;
export type LessonResourceId = string;
export type QuizId = string;
export type QuestionId = string;
export type OptionId = string;
export type TopicId = string;
export type SubtopicId = string;
export type EnrollmentId = string;
export type AttemptId = string;
export type AttemptAnswerId = string;

/** Bump when an event payload contract changes incompatibly (replay / consumers). */
export type EventVersion = number;

export type LessonKind = "video" | "text" | "mixed";

export type QuestionType = "single_choice" | "multiple_choice" | "short_text";

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export type EnrollmentStatus = "active" | "completed" | "paused" | "dropped";

/** Content hierarchy - mirrors `supabase/learning-intelligence-schema.sql`. */
export interface CourseCategory {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
}

export interface Course {
  id: CourseId;
  categoryId: string | null;
  slug: string;
  title: string;
  description: string | null;
  published: boolean;
  version: number;
}

export interface Module {
  id: ModuleId;
  courseId: CourseId;
  title: string;
  sortOrder: number;
}

export interface Lesson {
  id: LessonId;
  moduleId: ModuleId;
  title: string;
  sortOrder: number;
  kind: LessonKind;
  bodyMd: string | null;
  videoStoragePath: string | null;
  videoDurationSec: number | null;
  estimatedMinutes: number | null;
}

export interface LessonResource {
  id: LessonResourceId;
  lessonId: LessonId;
  title: string;
  storagePath: string;
  sortOrder: number;
}

export interface Topic {
  id: TopicId;
  courseId: CourseId;
  slug: string;
  label: string;
}

export interface Subtopic {
  id: SubtopicId;
  topicId: TopicId;
  slug: string;
  label: string;
}

export interface Quiz {
  id: QuizId;
  lessonId: LessonId | null;
  title: string;
  timeLimitSec: number | null;
  passingScorePct: number;
  sortOrder: number;
}

export interface QuizQuestion {
  id: QuestionId;
  quizId: QuizId;
  orderIndex: number;
  prompt: string;
  type: QuestionType;
  topicId: TopicId | null;
  subtopicId: SubtopicId | null;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  /** Authoritative explanation in content (AI may expand, not replace). */
  explanation: string | null;
}

export interface QuestionOption {
  id: OptionId;
  questionId: QuestionId;
  orderIndex: number;
  label: string;
  isCorrect: boolean;
}

export interface Enrollment {
  id: EnrollmentId;
  userId: UserId;
  courseId: CourseId;
  status: EnrollmentStatus;
  enrolledAt: string;
}

/** Business truth for lesson completion - not inferred from AI. */
export interface LessonProgress {
  id: string;
  userId: UserId;
  lessonId: LessonId;
  status: LessonProgressStatus;
  completedAt: string | null;
  lastVideoPositionSec: number | null;
  updatedAt: string;
}

/** Score and pass computed by application on submit - deterministic. */
export interface QuizAttempt {
  id: AttemptId;
  userId: UserId;
  quizId: QuizId;
  startedAt: string;
  submittedAt: string | null;
  scorePct: number | null;
  passed: boolean | null;
}

export interface QuizAttemptAnswer {
  id: AttemptAnswerId;
  attemptId: AttemptId;
  questionId: QuestionId;
  selectedOptionId: OptionId | null;
  isCorrect: boolean;
  answeredAt: string;
}
