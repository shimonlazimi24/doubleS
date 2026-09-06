/**
 * Builds the course manifest from the authoring source.
 *
 * **Build-time only — never import this from application code.** Reaching the
 * manifest this way pulls in `content-source/production-source`, which imports
 * 2.8MB of lesson, question and retrieval JSON, including the answer keys. That
 * is how the whole bank ended up in a browser chunk.
 *
 * `scripts/generate-course-manifest.mjs` runs this and writes the result to
 * `generated/course-manifest.json`. Application code reads that file through
 * `./manifest`, and `manifest-drift.test.ts` keeps the two in step.
 */
import { AMIRANT_PREPARATION_COURSE_ID, AMIRANT_PREPARATION_SLUG } from "./constants";
import type { CourseManifest } from "./types/course-manifest";
import { AMIRANT_SIMULATIONS } from "./simulations/definitions";
import { getResolvedAmirantProductionContent } from "./content-source/resolved-content";
import { AMIRNET_CONTENT_MODULES } from "./amirnet-content-sync";

const DEMO_MANIFEST: CourseManifest = {
  id: AMIRANT_PREPARATION_COURSE_ID,
  slug: AMIRANT_PREPARATION_SLUG,
  title: "הכנה לאמירנט",
  description:
    "הכנה מלאה לאמירנט: שיעורים, תרגול, בוחנים אדפטיביים, סימולציות מלאות, ניתוח AI.",
  modules: [
    {
      id: "mod-intro",
      slug: "introduction",
      title: "מבוא לקורס",
      sortOrder: 0,
      /** יחידה 1 - מבוא: קבצי `01_welcome_and_intro/` + אבחון; לוגיסטיקה בקובץ נפרד. */
      lessons: [
        {
          id: "lesson.intro.welcome",
          videoSlot: true,
          title: "ברוכים הבאים לקורס",
          kind: "text",
          estimatedMinutes: 25,
        },
        {
          id: "lesson.intro.roadmap",
          title: "מפת הדרכים של הקורס",
          kind: "text",
          estimatedMinutes: 20,
        },
        {
          id: "lesson.intro.diagnostic",
          title: "מבחן רמה",
          kind: "text",
          estimatedMinutes: 25,
          quizId: "quiz-entry-diagnostic",
        },
        {
          id: "lesson.intro.personal-roadmap",
          title: "מפת דרכים אישית",
          kind: "text",
          estimatedMinutes: 15,
        },
      ],
      practiceSets: [],
      quizzes: [
        {
          id: "quiz-entry-diagnostic",
          title: "מבחן רמה (15 שאלות)",
          adaptive: false,
          format: "fixed_placement",
          questionCount: 15,
          timeLimitSec: 20 * 60,
          topicSlugs: ["sentence_completion", "rephrasing", "reading_comprehension"],
        },
      ],
    },
    ...AMIRNET_CONTENT_MODULES,
    /** מחוץ למסלול הלמידה הראשי - נגיש מעמוד הקורס / קישור ישיר; אחרי סיכום הקורס בסדר מיון. */
    {
      id: "mod-logistics",
      slug: "logistics-bureaucracy",
      title: "לוגיסטיקה והרשמה",
      sortOrder: 9,
      lessons: [
        {
          id: "lesson.intro.logistics",
          title: "לוגיסטיקה, הרשמה וביורוקרטיה",
          kind: "text",
          estimatedMinutes: 55,
        },
      ],
      practiceSets: [],
      quizzes: [],
    },
  ],
  simulations: AMIRANT_SIMULATIONS,
};

/** The manifest as derived from source. Prefer the generated JSON at runtime. */
export function buildAmirantManifestFromSource(): CourseManifest {
  const imported = getResolvedAmirantProductionContent();
  return imported?.courseManifest ?? DEMO_MANIFEST;
}
