/**
 * Course manifest (modules, lessons, quizzes, simulations) — **MVP: authored in TypeScript**.
 * For production CMS/Supabase: load rows with the same stable `id` values so routes and
 * `getManifest*` helpers stay unchanged; this file becomes a thin loader over HTTP/DB.
 */
import { AMIRANT_PREPARATION_COURSE_ID, AMIRANT_PREPARATION_SLUG } from "./constants";
import type { CourseManifest, ManifestQuiz } from "./types/course-manifest";
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
      /** יחידה 1 — מבוא: קבצי `01_welcome_and_intro/` + אבחון; לוגיסטיקה בקובץ נפרד. */
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
    /** מחוץ למסלול הלמידה הראשי — נגיש מעמוד הקורס / קישור ישיר; אחרי סיכום הקורס בסדר מיון. */
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

const imported = getResolvedAmirantProductionContent();
export const AMIRANT_PREPARATION_MANIFEST: CourseManifest =
  imported?.courseManifest ?? DEMO_MANIFEST;

export function getManifestQuiz(quizId: string): ManifestQuiz | undefined {
  for (const m of AMIRANT_PREPARATION_MANIFEST.modules) {
    const q = m.quizzes.find((x) => x.id === quizId);
    if (q) return q;
  }
  return undefined;
}

export function getManifestLesson(lessonId: string) {
  for (const m of AMIRANT_PREPARATION_MANIFEST.modules) {
    const l = m.lessons.find((x) => x.id === lessonId);
    if (l) return { lesson: l, module: m };
  }
  return undefined;
}

export function getManifestPracticeSet(setId: string) {
  for (const m of AMIRANT_PREPARATION_MANIFEST.modules) {
    const p = m.practiceSets.find((x) => x.id === setId);
    if (p) return { set: p, module: m };
  }
  return undefined;
}

export function getSimulation(id: string) {
  return AMIRANT_PREPARATION_MANIFEST.simulations.find((s) => s.id === id);
}
