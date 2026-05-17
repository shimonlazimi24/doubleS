import { AMIRANT_PREPARATION_MANIFEST } from "./manifest";
import type { ManifestLesson, ManifestModule } from "./types/course-manifest";

export type ModuleByLessonId = { module: ManifestModule; lesson: ManifestLesson; indexInModule: number };

export type AmirantCourseLessonRow = {
  index: number;
  totalLessons: number;
  lesson: ManifestLesson;
  module: ManifestModule;
};

function sortedModules(): ManifestModule[] {
  return [...AMIRANT_PREPARATION_MANIFEST.modules].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAmirantCourseFlatLessons(): AmirantCourseLessonRow[] {
  const mods = sortedModules();
  const out: AmirantCourseLessonRow[] = [];
  for (const m of mods) {
    for (const l of m.lessons) {
      out.push({
        index: out.length,
        totalLessons: 0,
        lesson: l,
        module: m,
      });
    }
  }
  const total = out.length;
  return out.map((r) => ({ ...r, totalLessons: total }));
}

export function getAmirantCourseLessonEntry(lessonId: string): AmirantCourseLessonRow | undefined {
  return getAmirantCourseFlatLessons().find((r) => r.lesson.id === lessonId);
}

/** Module containing the lesson + index within that module’s lesson list. */
export function getModuleByLessonId(lessonId: string): ModuleByLessonId | undefined {
  for (const m of sortedModules()) {
    const indexInModule = m.lessons.findIndex((l) => l.id === lessonId);
    if (indexInModule >= 0) return { module: m, lesson: m.lessons[indexInModule]!, indexInModule };
  }
  return undefined;
}

export function getAmirantCourseLessonNeighbors(lessonId: string): { prev?: AmirantCourseLessonRow; next?: AmirantCourseLessonRow } {
  const flat = getAmirantCourseFlatLessons();
  const idx = flat.findIndex((r) => r.lesson.id === lessonId);
  if (idx < 0) return {};
  return {
    prev: idx > 0 ? flat[idx - 1] : undefined,
    next: idx < flat.length - 1 ? flat[idx + 1] : undefined,
  };
}

export function getAmirantCourseFirstLessonId(): string | null {
  const flat = getAmirantCourseFlatLessons();
  return flat[0]?.lesson.id ?? null;
}

export function getManifestModuleBySlug(moduleSlug: string): ManifestModule | undefined {
  return sortedModules().find((m) => m.slug === moduleSlug);
}
