/**
 * Lesson progress state. Anonymous users: localStorage; signed-in: merged to `amirant_lesson_progress`.
 */
export type AmirantLessonProgressEntry = {
  startedAt: string;
  /** ISO timestamp when the learner marked the lesson done. */
  completedAt?: string;
};

export type AmirantProgressStateV1 = {
  version: 1;
  courseId: string;
  lessons: Record<string, AmirantLessonProgressEntry>;
};

export function defaultAmirantProgressState(courseId: string): AmirantProgressStateV1 {
  return { version: 1, courseId, lessons: {} };
}
