import type { ManifestModule } from "./types/course-manifest";
import type { AmirantProgressStateV1 } from "./progress/types";
import {
  countCompletedLessons,
  countManifestLessons,
  courseProgressPercent,
  isLessonComplete,
  isLessonStarted,
} from "./progress/compute";

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export { countCompletedLessons, countManifestLessons, courseProgressPercent };

export function getLessonProgressStatus(
  progress: AmirantProgressStateV1,
  lessonId: string,
): LessonProgressStatus {
  if (isLessonComplete(progress, lessonId)) return "completed";
  if (isLessonStarted(progress, lessonId)) return "in_progress";
  return "not_started";
}

export function moduleProgress(
  module: ManifestModule,
  progress: AmirantProgressStateV1,
): { completed: number; total: number; percent: number } {
  const total = module.lessons.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  let completed = 0;
  for (const lesson of module.lessons) {
    if (isLessonComplete(progress, lesson.id)) completed += 1;
  }
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}
