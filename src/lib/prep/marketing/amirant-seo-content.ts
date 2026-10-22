import { AMIRANT_PREPARATION_MANIFEST, countManifestLessons } from "@/lib/amirant-course";
import {
  EXAM_PILOT,
  EXAM_QUESTION_SHARE,
  EXAM_REFORM,
  EXAM_SCORE_BANDS,
  EXAM_SCORE_SCALE,
  EXAM_SCORED_MINUTES,
  EXAM_SCORED_QUESTION_COUNT,
  EXAM_SCORED_SEGMENTS,
  EXAM_TOTAL_MINUTES,
} from "@/lib/amirant-course/exam-facts";
import { PREP_BASE } from "@/lib/prep/constants";
import { PLAN_DAYS, PLAN_PRICES_NIS } from "@/lib/prep/pricing-plans";

/**
 * Plain-data content for the public /prep/amirant page: what the course holds,
 * the plans, the 2026 reform as the course teaches it, and the FAQ.
 *
 * Every number here is derived from the course manifest, the pricing table or
 * `exam-facts.ts` - nothing is typed by hand, so the visible page, the JSON-LD
 * and llms.txt can never disagree with each other or with checkout.
 *
 * Rendering is the page's job; this module only owns the words and figures.
 */

/* ------------------------------------------------------------------ */
/* Counts                                                              */
/* ------------------------------------------------------------------ */

function countLessonsById(prefix: string): number {
  let n = 0;
  for (const mod of AMIRANT_PREPARATION_MANIFEST.modules) {
    for (const lesson of mod.lessons) if (lesson.id.startsWith(prefix)) n += 1;
  }
  return n;
}

export const AMIRANT_COURSE_COUNTS = {
  modules: AMIRANT_PREPARATION_MANIFEST.modules.length,
  lessons: countManifestLessons(AMIRANT_PREPARATION_MANIFEST),
  sentenceCompletionTests: countLessonsById("lesson.sc.test-"),
  restatementSets: countLessonsById("lesson.rephrase.set-"),
  readingPassages: countLessonsById("lesson.reading.passage-"),
  wordFormationTests: countLessonsById("lesson.reform.wf-"),
  listeningTests: countLessonsById("lesson.listening.test-"),
  writingTasks: countLessonsById("lesson.writing.task-"),
  simulations: AMIRANT_PREPARATION_MANIFEST.simulations.length,
} as const;

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

export type AmirantPlanFact = {
  id: "week" | "two_weeks" | "month";
  labelHe: string;
  days: number;
  priceNis: number;
};

export const AMIRANT_PLAN_FACTS: readonly AmirantPlanFact[] = [
  { id: "week", labelHe: "שבוע", days: PLAN_DAYS.week!, priceNis: PLAN_PRICES_NIS.week! },
  { id: "two_weeks", labelHe: "שבועיים", days: PLAN_DAYS.two_weeks!, priceNis: PLAN_PRICES_NIS.two_weeks! },
  { id: "month", labelHe: "חודש", days: PLAN_DAYS.month!, priceNis: PLAN_PRICES_NIS.month! },
] as const;

export const AMIRANT_PLANS_SUMMARY_HE = AMIRANT_PLAN_FACTS.map(
  (p) => `${p.labelHe} ${p.priceNis} ₪`,
).join(", ");

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

export type AmirantSeoSection = {
  id: string;
  /** Short kicker above the heading. */
  eyebrowHe: string;
  headingHe: string;
  /** One or two paragraphs. */
  paragraphsHe: readonly string[];
  /** Optional flat list under the paragraphs. */
  bulletsHe?: readonly string[];
};

const C = AMIRANT_COURSE_COUNTS;

/** What is in the course - the inventory a buyer wants before paying. */
export const AMIRANT_WHATS_INSIDE_SECTION: AmirantSeoSection = {
  id: "whats-inside",
  eyebrowHe: "מה בקורס",
  headingHe: `${C.modules} מודולים, ${C.lessons} שיעורים ו-${C.simulations} סימולציות מלאות`,
  paragraphsHe: [
    `הקורס בנוי בסדר הלימוד של המבחן עצמו: מבוא ומבחן רמה, אוצר מילים אקדמי בארבע רמות, ואז שלושת סוגי השאלות המנוקדים - השלמת משפטים, ניסוח מחדש והבנת הנקרא - כל אחד עם מדריך שיטות, מלכודות נפוצות ומבחני תרגול ברמת קושי עולה. אחרי הליבה מגיעים מודול הרפורמה, הסימולציות המלאות, טיפים ליום המבחן וסיכום.`,
    `כל שאלה מגיעה עם הסבר לתשובה, וכל מבחן תרגול מדווח לדשבורד האישי שמצביע על הנושאים שדורשים חיזוק.`,
  ],
  bulletsHe: [
    `${C.sentenceCompletionTests} מבחני תרגול בהשלמת משפטים - סוג השאלה שמשקלו הגדול ביותר בציון`,
    `${C.restatementSets} מקבצי תרגול בניסוח מחדש, מרמה קלה ועד הקשה ביותר`,
    `${C.readingPassages} קטעי קריאה אקדמיים עם שאלות הבנת הנקרא`,
    `${C.wordFormationTests} מבחני יצירת מילה (Word Formation) לקראת פרקי הפיילוט`,
    `${C.listeningTests} מבחני האזנה (הרצאה או שיחה) עם קטעי שמע ותמליל אחרי הבדיקה`,
    `${C.writingTasks} מטלות כתיבה עם בדיקה בשני הממדים של המבחן, משוב וחיבורים לדוגמה בשלוש רמות`,
    `${C.simulations} סימולציות מלאות עם טיימר נפרד לכל פרק ודוח אישי בסיום`,
    "עוזר AI בעברית בגישה המלאה: רמזים, הסברים והמלצות המשך בהקשר השיעור",
  ],
};

/** Who the course is for - set the expectation in one place. */
export const AMIRANT_WHO_FOR_SECTION: AmirantSeoSection = {
  id: "who-for",
  eyebrowHe: "למי זה מתאים",
  headingHe: "למי שנבחנים באמירנט בשבועות הקרובים",
  paragraphsHe: [
    "הקורס מיועד למועמדים וסטודנטים לפני תואר ראשון או שני שצריכים ציון אמירנט לקבלה, לסיווג לרמת אנגלית או לפטור מקורסי אנגלית אקדמית. הוא מתאים גם למי שניגשים למבחן חוזר ורוצים לעלות מדרגה, ולמי שלמדו אנגלית מזמן וצריכים לרענן אוצר מילים אקדמי ושיטות פתרון.",
    "מודול המבוא ומבחן הרמה פתוחים בחינם, בלי כרטיס אשראי. מי שרוצים להמשיך לשיעורים, לתרגול ולסימולציות רוכשים גישה לזמן קצוב.",
  ],
};

/** Plans - prices straight from the checkout table. */
export const AMIRANT_PLANS_SECTION: AmirantSeoSection = {
  id: "plans",
  eyebrowHe: "מחירים",
  headingHe: "גישה לזמן קצוב, בלי מנוי מתחדש",
  paragraphsHe: [
    `שלוש תוכניות, כולן עם גישה מלאה לכל הקורס: ${AMIRANT_PLAN_FACTS.map(
      (p) => `${p.labelHe} (${p.days} ימים) ב-${p.priceNis} ₪`,
    ).join(", ")}. התשלום חד-פעמי ולא מתחדש אוטומטית; מי שצריכים עוד זמן מאריכים מתוך החשבון.`,
    "הסליקה מתבצעת בדף תשלום מאובטח של חברת הסליקה, ופרטי הכרטיס אינם עוברים בשרתי האתר.",
  ],
  bulletsHe: AMIRANT_PLAN_FACTS.map((p) => `גישה ל${p.labelHe} - ${p.priceNis} ₪`),
};

/** The 2026 reform, phrased exactly as the course material describes it. */
export const AMIRANT_REFORM_SECTION: AmirantSeoSection = {
  id: "reform-2026",
  eyebrowHe: `רפורמת ${EXAM_REFORM.dateHe}`,
  headingHe: "מה השתנה במבחן ב-2026, ומה זה אומר על ההכנה",
  paragraphsHe: [
    `מ${EXAM_REFORM.dateHe} כל נבחן יכול להפעיל הקראת טקסט (Text-to-Speech) לכל קטע במבחן, ללא אישור מיוחד. בנוסף נוספו ${EXAM_PILOT.segmentsMin}-${EXAM_PILOT.segmentsMax} פרקי ניסוי (עד ${EXAM_PILOT.maxMinutes} דקות) שאינם נספרים בציון: ${EXAM_PILOT.skillsHe.join(", ")}.`,
    `החלק המנוקד נשאר כפי שהיה - ${EXAM_SCORED_QUESTION_COUNT} שאלות ב-${EXAM_SCORED_MINUTES} דקות של השלמת משפטים, ניסוח מחדש והבנת הנקרא - ושם נקבע הציון. בקורס יש מודול רפורמה שלם (מדריכי Listening, יצירת מילה, דקדוק בהקשר וכתיבה) לצד הליבה הקלאסית, כדי שלא יפתיעו אתכם ביום המבחן.`,
  ],
};

export const AMIRANT_SEO_SECTIONS: readonly AmirantSeoSection[] = [
  AMIRANT_WHATS_INSIDE_SECTION,
  AMIRANT_WHO_FOR_SECTION,
  AMIRANT_PLANS_SECTION,
  AMIRANT_REFORM_SECTION,
];

/* ------------------------------------------------------------------ */
/* FAQ - one list for the visible section and the FAQPage schema       */
/* ------------------------------------------------------------------ */

export type AmirantFaqItem = { q: string; a: string };

const scoreBandsHe = EXAM_SCORE_BANDS.map((b) => `${b.min}-${b.max} ${b.levelHe} (${b.meaningHe})`).join("; ");
const rcSegment = EXAM_SCORED_SEGMENTS.find((s) => s.type === "reading_comprehension");

export const AMIRANT_FAQ: readonly AmirantFaqItem[] = [
  {
    q: "מה זה אמירנט?",
    a: `אמירנט הוא מבחן אנגלית אקדמי ממוחשב של מאל״ו (המרכז הארצי לבחינות ולהערכה), הנדרש לקבלה לאוניברסיטאות ומכללות בישראל ולסיווג לרמת אנגלית. המבחן אדפטיבי - רמת השאלות מסתגלת לביצועי הנבחן - והציון נע על סולם ${EXAM_SCORE_SCALE.min}-${EXAM_SCORE_SCALE.max}.`,
  },
  {
    q: "כמה שאלות יש באמירנט וכמה זמן הוא נמשך?",
    a: `${EXAM_SCORED_QUESTION_COUNT} שאלות מנוקדות ב-${EXAM_SCORED_SEGMENTS.length} פרקים (${EXAM_SCORED_MINUTES} דקות): ${EXAM_QUESTION_SHARE.sentence_completion} השלמת משפטים, ${EXAM_QUESTION_SHARE.rephrasing} ניסוח מחדש וקטע קריאה עם ${rcSegment?.questionCount ?? EXAM_QUESTION_SHARE.reading_comprehension} שאלות. בנוסף ${EXAM_PILOT.segmentsMin}-${EXAM_PILOT.segmentsMax} פרקי ניסוי שאינם נספרים בציון, עד ${EXAM_PILOT.maxMinutes} דקות. בסך הכול כ-${EXAM_TOTAL_MINUTES.min}-${EXAM_TOTAL_MINUTES.max} דקות.`,
  },
  {
    q: "מה ציון עובר באמירנט?",
    a: `אין ציון נכשל רשמי - הסולם ${EXAM_SCORE_SCALE.min}-${EXAM_SCORE_SCALE.max} ממפה לרמות אנגלית, וכל מוסד קובע את הסף שלו: ${scoreBandsHe}. בדקו את הדרישה המדויקת מול המוסד והתוכנית שלכם.`,
  },
  {
    q: "מה השתנה ברפורמת אמירנט 2026?",
    a: `מ${EXAM_REFORM.dateHe} יש הקראת טקסט (Text-to-Speech) לכל נבחן, ונוספו פרקי ניסוי של ${EXAM_PILOT.skillsHe.join(", ")} שאינם נספרים בציון. החלק המנוקד - השלמת משפטים, ניסוח מחדש והבנת הנקרא - לא השתנה.`,
  },
  {
    q: "מה כולל קורס ההכנה לאמירנט של PREPARE?",
    a: `${C.modules} מודולים ו-${C.lessons} שיעורים: אוצר מילים אקדמי, ${C.sentenceCompletionTests} מבחני תרגול בהשלמת משפטים, ${C.restatementSets} מקבצי ניסוח מחדש, ${C.readingPassages} קטעי קריאה, ${C.wordFormationTests} מבחני יצירת מילה, ${C.listeningTests} מבחני האזנה ו-${C.writingTasks} מטלות כתיבה עם בדיקה למודול הרפורמה, ${C.simulations} סימולציות מלאות עם טיימר לכל פרק, דשבורד התקדמות ועוזר AI בעברית בגישה המלאה.`,
  },
  {
    q: "כמה עולה הקורס, ולכמה זמן הגישה?",
    a: `גישה מלאה לכל הקורס: ${AMIRANT_PLAN_FACTS.map((p) => `${p.labelHe} (${p.days} ימים) ${p.priceNis} ₪`).join(", ")}. התשלום חד-פעמי ואינו מנוי מתחדש. מודול המבוא ומבחן הרמה פתוחים בחינם, בלי כרטיס אשראי.`,
  },
  {
    q: "כמה זמן צריך ללמוד לאמירנט?",
    a: "בממוצע 2-4 שבועות של לימוד מסודר, שעה-שעתיים ביום. מי שמגיעים עם בסיס חזק יכולים להתכונן גם ב-10 ימים; מי שצריכים חיזוק יסודי - 4-6 שבועות. יותר ממחצית הציון יושבת על השלמת משפטים, ושם הכנה ממוקדת משתלמת הכי מהר.",
  },
  {
    q: "האם הקורס רשמי של מאל״ו, והאם הוא מבטיח פטור?",
    a: "לא. PREPARE הוא קורס הכנה עצמאי ואינו קשור למאל״ו. ציון, פטור מקורסי אנגלית וקבלה ללימודים נקבעים במבחן האמירנט הרשמי ובמדיניות המוסד. מבחן הרמה באתר נותן הערכת רמה משוערת ואינו ציון רשמי.",
  },
];
