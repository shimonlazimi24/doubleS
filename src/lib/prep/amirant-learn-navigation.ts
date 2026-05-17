import { AMIRANT_DEMO_MODULES, type DemoLesson, type DemoModule } from "@/lib/prep/amirant-demo/demo-course-content";

export type AmirantFlatLesson = {
  lesson: DemoLesson;
  module: DemoModule;
  /** 0-based index in flattened course */
  index: number;
  totalLessons: number;
};

function sortedModules(): DemoModule[] {
  return [...AMIRANT_DEMO_MODULES].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** כל השיעורים לפי סדר הקורס (לניווט וסרגל צד). */
export function getAmirantFlatLessons(): AmirantFlatLesson[] {
  const modules = sortedModules();
  const flat: AmirantFlatLesson[] = [];
  for (const mod of modules) {
    const lessons = [...mod.lessons].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const lesson of lessons) {
      flat.push({ lesson, module: mod, index: flat.length, totalLessons: 0 });
    }
  }
  const total = flat.length;
  return flat.map((row) => ({ ...row, totalLessons: total }));
}

export function getAmirantLessonEntry(lessonId: string): AmirantFlatLesson | undefined {
  return getAmirantFlatLessons().find((x) => x.lesson.id === lessonId);
}

export function getAmirantLessonNeighbors(lessonId: string): {
  prev: AmirantFlatLesson | null;
  next: AmirantFlatLesson | null;
} {
  const flat = getAmirantFlatLessons();
  const i = flat.findIndex((x) => x.lesson.id === lessonId);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: i > 0 ? flat[i - 1]! : null,
    next: i < flat.length - 1 ? flat[i + 1]! : null,
  };
}

export function getAmirantFirstLessonId(): string | null {
  const flat = getAmirantFlatLessons();
  return flat[0]?.lesson.id ?? null;
}
