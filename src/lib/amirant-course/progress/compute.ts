import type { CourseManifest } from "../types/course-manifest";
import type { AmirantProgressStateV1 } from "./types";

export function countManifestLessons(manifest: CourseManifest): number {
  return manifest.modules.reduce((n, m) => n + m.lessons.length, 0);
}

export function countCompletedLessons(manifest: CourseManifest, progress: AmirantProgressStateV1): number {
  const ids = new Set(
    manifest.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  );
  let c = 0;
  for (const id of Array.from(ids)) {
    if (progress.lessons[id]?.completedAt) c += 1;
  }
  return c;
}

export function courseProgressPercent(manifest: CourseManifest, progress: AmirantProgressStateV1): number {
  const total = countManifestLessons(manifest);
  if (total === 0) return 0;
  const done = countCompletedLessons(manifest, progress);
  return Math.round((done / total) * 100);
}

export function isLessonComplete(progress: AmirantProgressStateV1, lessonId: string): boolean {
  return Boolean(progress.lessons[lessonId]?.completedAt);
}

export function isLessonStarted(progress: AmirantProgressStateV1, lessonId: string): boolean {
  return Boolean(progress.lessons[lessonId]?.startedAt || progress.lessons[lessonId]?.completedAt);
}
