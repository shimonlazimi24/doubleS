import type { LessonContent } from "./types/content-blocks";
import { AMIRNET_SYNC_LESSON_REGISTRY } from "./amirnet-content-sync";

/**
 * Lesson bodies - a static registry keyed like `AMIRANT_PREPARATION_MANIFEST`.
 * `amirnetMarkdownRel` points at a file under `content/amirnet-course/`; blocks
 * may accompany it (a callout, say) or stay empty. A CMS row overrides an entry
 * through `cms-override.server.ts`.
 *
 * Until 2026-10-22 this also ran the full authoring-package import on load,
 * only to fall back to this registry every time (the package never passes its
 * readiness gate). The import now runs at build time only (`manifest-source.ts`).
 */
function L(
  lessonId: string,
  blocks: LessonContent["blocks"],
  amirnetMarkdownRel?: string,
  amirnetMarkdownSectionIndex?: number,
): LessonContent {
  return {
    lessonId,
    blocks,
    ...(amirnetMarkdownRel ? { amirnetMarkdownRel } : {}),
    ...(amirnetMarkdownSectionIndex !== undefined ? { amirnetMarkdownSectionIndex } : {}),
  };
}

/** Lesson text: JSON blocks and/or a markdown file from the repo. */
export const AMIRANT_LESSON_REGISTRY: Record<string, LessonContent> = {
  /** מסמך 1.1 - masach index 0 */
  "lesson.intro.welcome": L(
    "lesson.intro.welcome",
    [],
    "01_welcome_and_intro/unit_1_complete_welcome_and_intro.md",
    0,
  ),
  /** מסמך 1.2 - masach index 1 */
  "lesson.intro.roadmap": L(
    "lesson.intro.roadmap",
    [],
    "01_welcome_and_intro/unit_1_complete_welcome_and_intro.md",
    1,
  ),
  /** ניווט ישיר למסך המבחן האדפטיבי - ה-MD לתרגול בדף נייר בלבד. */
  "lesson.intro.diagnostic": L(
    "lesson.intro.diagnostic",
    [
      {
        type: "callout",
        variant: "info",
        body: "למטה: כפתור «מבחן» - מבחן אדפטיבי בקורס (אותו מיקס נושאים: השלמה, ניסוח, קריאה). 15 השאלות בקובץ - לתרגול בדף-נייר/הדפסה; במערכת נבחרות שאלות אדפטיבית ממאגר.",
      },
    ],
    "01_welcome_and_intro/unit_1.3_entry_diagnostic_test.md",
  ),
  "lesson.intro.logistics": L(
    "lesson.intro.logistics",
    [],
    "02_logistics_bureaucracy/unit_2_logistics_and_bureaucracy.md",
  ),
  // The legacy `lesson.intro.doc-1-x` ids are redirected by the lesson page
  // (LEGACY_LESSON_REDIRECT) before the registry is consulted, so they have no entry here.
  ...AMIRNET_SYNC_LESSON_REGISTRY,
};

export function getLessonContent(lessonId: string): LessonContent | undefined {
  return AMIRANT_LESSON_REGISTRY[lessonId];
}
