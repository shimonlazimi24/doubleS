import type { ManifestLesson, ManifestModule } from "./types/course-manifest";

/** Visual category for curriculum outline rows (icons), derived from manifest only. */
export type OutlineLessonVisualKind = "video" | "reading" | "quiz" | "practice" | "simulation";

/**
 * Maps manifest fields to a single outline icon. Heuristics for mixed lessons favor
 * practice/quiz when those ids are set; simulations module uses lesson id for guide vs run.
 */
export function getOutlineLessonVisualKind(lesson: ManifestLesson, module: ManifestModule): OutlineLessonVisualKind {
  if (module.id === "mod-sims") {
    if (lesson.id === "lesson.sim.01" || lesson.id === "lesson.sim.02" || lesson.id === "lesson.sim.03") {
      return "reading";
    }
    return "simulation";
  }
  if (lesson.kind === "video") return "video";
  if (lesson.practiceSetId && lesson.quizId) return "practice";
  if (lesson.practiceSetId) return "practice";
  if (lesson.quizId) return "quiz";
  if (lesson.kind === "mixed") return "practice";
  return "reading";
}

/**
 * «כניסה למבחן» ביחידת מבוא (למשל אבחון) — בלי אקורדיון שלבים; כפתור play. שאר הקורס (כולל
 * שיעורים שמסומנים כ־quiz במניפסט אבל עשירים בשלבים) — אקורדיון כשיש 2+ שלבים.
 */
export function lessonUsesOutlineSubstepAccordion(lesson: ManifestLesson, module: ManifestModule): boolean {
  if (module.id === "mod-intro" && getOutlineLessonVisualKind(lesson, module) === "quiz") {
    return false;
  }
  return true;
}
