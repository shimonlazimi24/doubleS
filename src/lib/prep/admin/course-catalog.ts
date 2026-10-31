import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";

/** Lesson and module ids the course actually renders; the editor may only write these. */
export const COURSE_LESSON_IDS: ReadonlySet<string> = new Set(
  AMIRANT_PREPARATION_MANIFEST.modules.flatMap((m) => m.lessons.map((l) => l.id)),
);

export const COURSE_MODULE_IDS: ReadonlySet<string> = new Set(
  AMIRANT_PREPARATION_MANIFEST.modules.map((m) => m.id),
);

export const COURSE_CATALOG = { lessonIds: COURSE_LESSON_IDS, moduleIds: COURSE_MODULE_IDS };
