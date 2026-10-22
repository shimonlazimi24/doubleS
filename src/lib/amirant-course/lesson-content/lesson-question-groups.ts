/**
 * שיוך שיעורי "מבחן תרגול" לקבוצות שאלות בבנק (לפי תג הקבוצה) - כדי לרנדר את
 * השאלות כאינטראקטיביות (רכיב לחיץ עם בדיקה והסברים) במקום טקסט שטוח מה-md.
 *
 * השאלות עצמן כבר קיימות בבנק (עם תשובות והסברים) - אין פרסור תשובות מ-markdown.
 */

export type LessonQuestionGroup = {
  /** תג קבוצת השאלות בבנק (למשל `sc-quiz-2-easy`). */
  tag: string;
  /** טיימר מומלץ לסקשן (שניות) - אופציונלי, מופעל בלחיצת המשתמש. */
  timeLimitSec?: number;
};

const PRACTICE_QUIZ_TIME_SEC = 15 * 60;
/** Four restatement questions at the real exam pace of two minutes each. */
const OWNER_RS_SET_TIME_SEC = 4 * 2 * 60;
/** Eight sentence-completion questions at one minute each. */
const OWNER_SC_TEST_TIME_SEC = 8 * 60;
/** Reading passages run three minutes per question, reading time included. */
const OWNER_RC_SEC_PER_QUESTION = 3 * 60;
/** A listening test: three clips and five questions in seven minutes, as in the exam section. */
const OWNER_LS_TEST_TIME_SEC = 7 * 60;

export const LESSON_QUESTION_GROUPS: Record<string, LessonQuestionGroup> = {
  // -- השלמת משפטים --
  // -- Sentence completion: the content owner's tests (8 questions, 1 minute each) --
  "lesson.sc.test-01": { tag: "owner-sc-test-1", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-02": { tag: "owner-sc-test-2", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-03": { tag: "owner-sc-test-3", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-04": { tag: "owner-sc-test-4", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-05": { tag: "owner-sc-test-5", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-06": { tag: "owner-sc-test-6", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-07": { tag: "owner-sc-test-7", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-08": { tag: "owner-sc-test-8", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-09": { tag: "owner-sc-test-9", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-10": { tag: "owner-sc-test-10", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-11": { tag: "owner-sc-test-11", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-12": { tag: "owner-sc-test-12", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-13": { tag: "owner-sc-test-13", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  "lesson.sc.test-14": { tag: "owner-sc-test-14", timeLimitSec: OWNER_SC_TEST_TIME_SEC },
  // -- Restatement: the content owner's sets (4 questions, 2 minutes each) --
  "lesson.rephrase.set-01": { tag: "owner-rs-set-1", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-02": { tag: "owner-rs-set-2", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-03": { tag: "owner-rs-set-3", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-04": { tag: "owner-rs-set-4", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-05": { tag: "owner-rs-set-5", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-06": { tag: "owner-rs-set-6", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-07": { tag: "owner-rs-set-7", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-08": { tag: "owner-rs-set-8", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-09": { tag: "owner-rs-set-9", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-10": { tag: "owner-rs-set-10", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-11": { tag: "owner-rs-set-11", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-12": { tag: "owner-rs-set-12", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-13": { tag: "owner-rs-set-13", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  "lesson.rephrase.set-14": { tag: "owner-rs-set-14", timeLimitSec: OWNER_RS_SET_TIME_SEC },
  // -- Reading: the content owner's passages (3 minutes per question, as in the exam) --
  "lesson.reading.passage-01": { tag: "owner-rc-passage-1", timeLimitSec: 5 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-02": { tag: "owner-rc-passage-2", timeLimitSec: 5 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-03": { tag: "owner-rc-passage-3", timeLimitSec: 5 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-04": { tag: "owner-rc-passage-4", timeLimitSec: 5 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-05": { tag: "owner-rc-passage-5", timeLimitSec: 5 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-06": { tag: "owner-rc-passage-6", timeLimitSec: 5 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-07": { tag: "owner-rc-passage-7", timeLimitSec: 6 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-08": { tag: "owner-rc-passage-8", timeLimitSec: 6 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-09": { tag: "owner-rc-passage-9", timeLimitSec: 6 * OWNER_RC_SEC_PER_QUESTION },
  "lesson.reading.passage-10": { tag: "owner-rc-passage-10", timeLimitSec: 6 * OWNER_RC_SEC_PER_QUESTION },
  // -- האזנה: the content owner's tests (3 clips, 5 questions, 7 minutes including the listening) --
  "lesson.listening.test-01": { tag: "owner-ls-test-1", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-02": { tag: "owner-ls-test-2", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-03": { tag: "owner-ls-test-3", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-04": { tag: "owner-ls-test-4", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-05": { tag: "owner-ls-test-5", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-06": { tag: "owner-ls-test-6", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-07": { tag: "owner-ls-test-7", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-08": { tag: "owner-ls-test-8", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-09": { tag: "owner-ls-test-9", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-10": { tag: "owner-ls-test-10", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-11": { tag: "owner-ls-test-11", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-12": { tag: "owner-ls-test-12", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-13": { tag: "owner-ls-test-13", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  "lesson.listening.test-14": { tag: "owner-ls-test-14", timeLimitSec: OWNER_LS_TEST_TIME_SEC },
  // -- סימולציות (שאלותיהן בבנק, כולל קטעי קריאה) --
  "lesson.sim.04": { tag: "simulation-1-baseline", timeLimitSec: 39 * 60 },
  "lesson.sim.05": { tag: "simulation-2-warmup", timeLimitSec: 39 * 60 },
  "lesson.sim.06": { tag: "simulation-3-challenge", timeLimitSec: 39 * 60 },
  "lesson.sim.07": { tag: "simulation-4-final", timeLimitSec: 39 * 60 },
};

/** שיעורי סימולציה - הפניה לזמן-הריצה האינטראקטיבי (מזהי `simulations/definitions.ts`). */
export const SIMULATION_LESSON_RUNTIME: Record<string, string> = {
  "lesson.sim.04": "sim-01",
  "lesson.sim.05": "sim-02",
  "lesson.sim.06": "sim-03",
  "lesson.sim.07": "sim-04",
};

export function getLessonQuestionGroup(lessonId: string): LessonQuestionGroup | null {
  return LESSON_QUESTION_GROUPS[lessonId] ?? null;
}

/**
 * Word-formation lessons: the content owner's typed-answer tests (4 questions,
 * 45 seconds each, as in the exam). Not bank questions; see
 * `word-formation/word-formation.server.ts`.
 */
/**
 * Writing lessons: the content owner's tasks (one question, 90–120 words,
 * 12 minutes), graded on the server. Not bank questions; see
 * `writing/writing-tasks.server.ts`.
 */
export const WRITING_LESSONS: Record<string, { taskId: string; timeLimitSec: number }> = Object.fromEntries(
  Array.from({ length: 14 }, (_, i) => {
    const id = String(i + 1).padStart(2, "0");
    return [`lesson.writing.task-${id}`, { taskId: `writing-task-${id}`, timeLimitSec: 12 * 60 }];
  }),
);

export const WORD_FORMATION_LESSONS: Record<string, { test: number; timeLimitSec: number }> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [
    `lesson.reform.wf-${String(i + 1).padStart(2, "0")}`,
    { test: i + 1, timeLimitSec: 4 * 45 },
  ]),
);
