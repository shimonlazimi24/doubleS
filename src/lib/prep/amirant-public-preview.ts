import {
  AMIRANT_PREPARATION_MANIFEST,
  getManifestLesson,
  getManifestQuiz,
} from "@/lib/amirant-course";
import { isAmirantModuleFree } from "@/lib/prep/course-access";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Course home + introduction module lessons/quizzes — no login required. */
export function isPrepAmirantCoursePublicPreviewPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === COURSE_BASE) return true;

  const moduleMatch = path.match(/^\/prep\/amirant\/course\/module\/([^/]+)$/);
  if (moduleMatch && isAmirantModuleFree({ slug: decodeURIComponent(moduleMatch[1]) })) {
    return true;
  }

  const lessonMatch = path.match(/^\/prep\/amirant\/course\/lesson\/([^/]+)$/);
  if (lessonMatch) {
    const found = getManifestLesson(decodeURIComponent(lessonMatch[1]));
    if (found && isAmirantModuleFree(found.module)) return true;
  }

  const quizMatch = path.match(/^\/prep\/amirant\/course\/quiz\/([^/]+)$/);
  if (quizMatch) {
    const quizId = decodeURIComponent(quizMatch[1]);
    const quiz = getManifestQuiz(quizId);
    if (!quiz) return false;
    for (const mod of AMIRANT_PREPARATION_MANIFEST.modules) {
      if (mod.quizzes.some((q) => q.id === quiz.id) && isAmirantModuleFree(mod)) {
        return true;
      }
    }
  }

  return false;
}

export const AMIRANT_PUBLIC_PREVIEW_LESSON_URL = `${COURSE_BASE}/lesson/lesson.intro.welcome`;
