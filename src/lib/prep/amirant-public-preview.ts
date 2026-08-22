import { AMIRANT_FREE_MODULE_SLUGS } from "@/lib/prep/course-access";
import { PREP_BASE } from "@/lib/prep/constants";

/**
 * Which course URLs are readable without logging in.
 *
 * This runs in the middleware, on **every request to the site**. It used to
 * answer the question by consulting the course manifest — which imports the
 * content package, which imports 2.5MB of lesson, question and retrieval JSON
 * and validates it with Zod at module load. That pulled the whole bank into the
 * middleware bundle (627kB in the build output) and paid for parsing it on every
 * cold start, on requests that never touch the course at all.
 *
 * The free set is small and changes about as often as the pricing model, so it
 * is declared here as plain strings. `amirant-public-preview.test.ts` asserts
 * this list still matches the manifest, so the two cannot drift silently.
 */

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

/**
 * Lessons in the free module, by id.
 *
 * Listed rather than matched by prefix: `lesson.intro.logistics` shares the
 * "lesson.intro." prefix but lives in the paid logistics module, so a prefix
 * rule would have handed it out for free. The drift test caught that.
 */
const FREE_LESSON_IDS = new Set([
  "lesson.intro.welcome",
  "lesson.intro.roadmap",
  "lesson.intro.diagnostic",
  "lesson.intro.personal-roadmap",
]);

/** The placement test — advertised as free, no card. */
const FREE_QUIZ_IDS = new Set(["quiz-entry-diagnostic"]);

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/** Course home + introduction module lessons/quizzes — no login required. */
export function isPrepAmirantCoursePublicPreviewPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === COURSE_BASE) return true;

  const moduleMatch = path.match(/^\/prep\/amirant\/course\/module\/([^/]+)$/);
  if (moduleMatch && AMIRANT_FREE_MODULE_SLUGS.has(decodeURIComponent(moduleMatch[1]))) {
    return true;
  }

  const lessonMatch = path.match(/^\/prep\/amirant\/course\/lesson\/([^/]+)$/);
  if (lessonMatch && FREE_LESSON_IDS.has(decodeURIComponent(lessonMatch[1]))) {
    return true;
  }

  const quizMatch = path.match(/^\/prep\/amirant\/course\/quiz\/([^/]+)$/);
  if (quizMatch && FREE_QUIZ_IDS.has(decodeURIComponent(quizMatch[1]))) {
    return true;
  }

  return false;
}

export const AMIRANT_PUBLIC_PREVIEW_LESSON_URL = `${COURSE_BASE}/lesson/lesson.intro.welcome`;

/** Exported for the drift test only. */
export const PUBLIC_PREVIEW_RULES = {
  freeLessonIds: FREE_LESSON_IDS,
  freeQuizIds: FREE_QUIZ_IDS,
};
