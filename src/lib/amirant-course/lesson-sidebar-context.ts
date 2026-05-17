import { displayModuleTitleHe } from "./syllabus-ui";
import type { ManifestModule } from "./types/course-manifest";
import { AMIRANT_PREPARATION_MANIFEST } from "./manifest";

function sortedModules(): ManifestModule[] {
  return [...AMIRANT_PREPARATION_MANIFEST.modules].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 1-based position of the module in the course order (sorted by sortOrder). */
export function getCourseModuleOrdinal(moduleId: string): number {
  const mods = sortedModules();
  const i = mods.findIndex((m) => m.id === moduleId);
  return i >= 0 ? i + 1 : 1;
}

/** First line under «מסלול השיעור» — e.g. יחידה 1: פתיחה והיכרות */
export function unitHeadingLineForLessonSidebar(module: ManifestModule, moduleOrdinal: number): string {
  const sub =
    module.id === "mod-intro"
      ? "פתיחה והיכרות"
      : displayModuleTitleHe(module);
  return `יחידה ${moduleOrdinal}: ${sub}`;
}

/** Second header line — e.g. שיעור 1.1: כותרת */
export function lessonHeadingLineForSidebar(moduleOrdinal: number, indexInModule: number, lessonTitle: string): string {
  return `שיעור ${moduleOrdinal}.${indexInModule + 1}: ${lessonTitle}`;
}

export type SidebarNextLessonProps = {
  href: string;
  lessonTitle: string;
  /** המשך ביחידה | היחידה הבאה: … */
  scopeEyebrow: string;
};
