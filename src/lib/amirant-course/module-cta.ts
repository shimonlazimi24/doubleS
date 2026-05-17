import type { ManifestModule } from "./types/course-manifest";
import type { LessonProgressStatus } from "./progress-calculations";

/**
 * First incomplete lesson in module order; if all complete, first lesson (review).
 */
export function getModulePrimaryLessonId(
  mod: ManifestModule,
  getLessonStatus: (lessonId: string) => LessonProgressStatus,
): string | null {
  for (const l of mod.lessons) {
    if (getLessonStatus(l.id) !== "completed") return l.id;
  }
  return mod.lessons[0]?.id ?? null;
}

export function getModuleCtaLabel(
  mod: ManifestModule,
  getLessonStatus: (lessonId: string) => LessonProgressStatus,
): "התחל" | "המשך" | "סיום" {
  if (mod.lessons.length === 0) return "התחל";
  const allDone = mod.lessons.length > 0 && mod.lessons.every((l) => getLessonStatus(l.id) === "completed");
  if (allDone) return "סיום";
  const first = mod.lessons[0];
  if (first && getLessonStatus(first.id) === "not_started") {
    return mod.lessons.some((l) => getLessonStatus(l.id) !== "not_started") ? "המשך" : "התחל";
  }
  return "המשך";
}
