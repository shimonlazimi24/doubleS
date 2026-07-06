/**
 * שיוך שיעורי "מבחן תרגול" לקבוצות שאלות בבנק (לפי תג הקבוצה) — כדי לרנדר את
 * השאלות כאינטראקטיביות (רכיב לחיץ עם בדיקה והסברים) במקום טקסט שטוח מה-md.
 *
 * השאלות עצמן כבר קיימות בבנק (עם תשובות והסברים) — אין פרסור תשובות מ-markdown.
 */

export type LessonQuestionGroup = {
  /** תג קבוצת השאלות בבנק (למשל `sc-quiz-2-easy`). */
  tag: string;
  /** טיימר מומלץ לסקשן (שניות) — אופציונלי, מופעל בלחיצת המשתמש. */
  timeLimitSec?: number;
};

const PRACTICE_QUIZ_TIME_SEC = 15 * 60;

export const LESSON_QUESTION_GROUPS: Record<string, LessonQuestionGroup> = {
  // —— השלמת משפטים ——
  "lesson.sc.04": { tag: "sample-sc-quiz-1-easy", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.05": { tag: "sc-quiz-2-easy", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.06": { tag: "sc-quiz-3-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.07": { tag: "sc-quiz-4-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.08": { tag: "sc-quiz-5-hard", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.09": { tag: "sc-quiz-6-hard", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.10": { tag: "sc-quiz-7-mixed", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.sc.11": { tag: "sc-quiz-8-mixed", timeLimitSec: 20 * 60 },
  // —— ניסוח מחדש ——
  "lesson.rephrase.04": { tag: "sample-restatement-quiz-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.05": { tag: "restatement-quiz-1-easy", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.06": { tag: "restatement-quiz-2-easy", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.07": { tag: "restatement-quiz-3-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.08": { tag: "restatement-quiz-4-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.09": { tag: "restatement-quiz-5-hard", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.10": { tag: "restatement-quiz-6-hard", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.rephrase.11": { tag: "restatement-quiz-7-mixed", timeLimitSec: 20 * 60 },
  "lesson.rephrase.12": { tag: "restatement-quiz-8-mixed", timeLimitSec: 20 * 60 },
  // —— הבנת הנקרא —— (lesson.reading.04 = קובץ SAMPLE ללא שורות בנק — נשאר קריאה)
  "lesson.reading.05": { tag: "reading-comp-quiz-1-easy", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.reading.06": { tag: "reading-comp-quiz-2-easy", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.reading.07": { tag: "reading-comp-quiz-3-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.reading.08": { tag: "reading-comp-quiz-4-intermediate", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.reading.09": { tag: "reading-comp-quiz-5-hard", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.reading.10": { tag: "reading-comp-quiz-6-hard", timeLimitSec: PRACTICE_QUIZ_TIME_SEC },
  "lesson.reading.11": { tag: "reading-comp-quiz-7-mixed", timeLimitSec: 25 * 60 },
  "lesson.reading.12": { tag: "reading-comp-quiz-8-mixed", timeLimitSec: 25 * 60 },
  // —— סימולציות (שאלותיהן בבנק, כולל קטעי קריאה) ——
  "lesson.sim.04": { tag: "simulation-1-baseline", timeLimitSec: 39 * 60 },
  "lesson.sim.05": { tag: "simulation-2-warmup", timeLimitSec: 39 * 60 },
  "lesson.sim.06": { tag: "simulation-3-challenge", timeLimitSec: 39 * 60 },
  "lesson.sim.07": { tag: "simulation-4-final", timeLimitSec: 39 * 60 },
};

/** שיעורי סימולציה — הפניה לזמן-הריצה האינטראקטיבי (מזהי `simulations/definitions.ts`). */
export const SIMULATION_LESSON_RUNTIME: Record<string, string> = {
  "lesson.sim.04": "sim-01",
  "lesson.sim.05": "sim-02",
  "lesson.sim.06": "sim-03",
  "lesson.sim.07": "sim-04",
};

export function getLessonQuestionGroup(lessonId: string): LessonQuestionGroup | null {
  return LESSON_QUESTION_GROUPS[lessonId] ?? null;
}
