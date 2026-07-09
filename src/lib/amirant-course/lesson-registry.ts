import type { LessonContent } from "./types/content-blocks";
import { AMIRNET_SYNC_LESSON_REGISTRY } from "./amirnet-content-sync";
import { getResolvedAmirantProductionContent } from "./content-source/resolved-content";

/**
 * Lesson bodies - **MVP: static registry**. Replace with CMS or `courses` / `lessons` tables
 * (JSON column for blocks) while keeping `lessonId` keys aligned with `AMIRANT_PREPARATION_MANIFEST`.
 * `amirnetMarkdownRel` - טעינה מ־`content/amirnet-course/`. blocks יכולים ללווה (למשל callout) או להישאר ריקים.
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

/** טקסט שיעור - בלוקי JSON, ו/או קובץ MD מהריפו. */
const DEMO_LESSON_REGISTRY: Record<string, LessonContent> = {
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
  /** Legacy IDs - נשמרים ל-alias בדף השיעור */
  "lesson.intro.doc-1-1": L(
    "lesson.intro.doc-1-1",
    [],
    "01_welcome_and_intro/unit_1_complete_welcome_and_intro.md",
    0,
  ),
  "lesson.intro.doc-1-2": L(
    "lesson.intro.doc-1-2",
    [],
    "01_welcome_and_intro/unit_1_complete_welcome_and_intro.md",
    1,
  ),
  "lesson.intro.doc-1-3": L(
    "lesson.intro.doc-1-3",
    [],
    "01_welcome_and_intro/unit_1_complete_welcome_and_intro.md",
    2,
  ),
  ...AMIRNET_SYNC_LESSON_REGISTRY,
};

const imported = getResolvedAmirantProductionContent();
export const AMIRANT_LESSON_REGISTRY: Record<string, LessonContent> =
  imported?.lessonRegistry ?? DEMO_LESSON_REGISTRY;

export function getLessonContent(lessonId: string): LessonContent | undefined {
  return AMIRANT_LESSON_REGISTRY[lessonId];
}
