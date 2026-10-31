/**
 * The public sample questions at /prep/amirant/sample-questions.
 *
 * Every item is copied from the owner's method guides (units 4.2, 5.2, 6.2,
 * 7.2, 7.4 and 7.6 of content/amirnet-course), where it already appears with
 * its answer and explanation. None comes from a graded practice set or from the
 * simulation pool: those are met once, cold, inside the course, and publishing
 * one would spoil it.
 */

export type SampleSection =
  | "sentence_completion"
  | "restatement"
  | "reading_comprehension"
  | "listening"
  | "word_formation"
  | "grammar_in_context";

export type SampleQuestion = {
  id: string;
  section: SampleSection;
  /** Shown above the stem: which part of the exam this is, and whether it counts. */
  sectionHe: string;
  scored: boolean;
  /** Passage, transcript or instruction shown before the stem, in English. */
  context?: string;
  /** Short Hebrew label for the context block ("קטע הקריאה", "תמליל"). */
  contextLabelHe?: string;
  stem: string;
  options: readonly string[];
  /** 0-based index into options. */
  correct: number;
  explanationHe: string;
};

export const SAMPLE_SECTION_LABELS: Record<SampleSection, string> = {
  sentence_completion: "השלמת משפטים",
  restatement: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
  listening: "הבנת הנשמע (פרק ניסוי)",
  word_formation: "יצירת מילה (פרק ניסוי)",
  grammar_in_context: "דקדוק בהקשר (פרק ניסוי)",
};

const POCKET_PARKS =
  'Many studies have shown that people who spend time in nature experience lower levels of stress and improved mental health. However, urban residents often have limited access to green spaces. To address this, cities like Singapore and Copenhagen have begun incorporating "pocket parks" - small, scattered green areas - throughout their neighborhoods. Early research suggests that even brief exposure to these small parks can have measurable positive effects on well-being.';

const TRAIN_ANNOUNCEMENT =
  "Attention passengers. The 3:15 train to Haifa has been delayed by twenty minutes due to signal problems. Passengers holding tickets for this train may wait on Platform 4. Free coffee will be available at the station café until departure. We apologize for the inconvenience.";

export const SAMPLE_QUESTIONS: readonly SampleQuestion[] = [
  {
    id: "sc-1",
    section: "sentence_completion",
    sectionHe: SAMPLE_SECTION_LABELS.sentence_completion,
    scored: true,
    stem: "Although the medicine was ______, many patients refused to take it.",
    options: ["expensive", "effective", "harmful", "useless"],
    correct: 1,
    explanationHe:
      "Although מסמן ניגוד. מה מנוגד לסירוב לקחת תרופה? משהו טוב ויעיל. effective יוצרת ניגוד חזק: מסרבים לקחת דבר שעובד. סירוב לדבר מזיק (harmful) או חסר ערך (useless) הוא הגיוני ולא ניגוד, ו-expensive יוצרת ניגוד חלש בלבד.",
  },
  {
    id: "sc-2",
    section: "sentence_completion",
    sectionHe: SAMPLE_SECTION_LABELS.sentence_completion,
    scored: true,
    stem: "The research findings were ______ by the scientific community, which had expected different results.",
    options: ["accepted", "announced", "published", "questioned"],
    correct: 3,
    explanationHe:
      "הרמז: which had expected different results. הקהילה ציפתה לתוצאות אחרות, ולכן פקפקה בממצאים. accepted, announced ו-published נשמעות מחקריות, אבל רק questioned מתאימה לציפיות שנכזבו. בודקים לפי ההקשר הספציפי, לא לפי הנושא הכללי.",
  },
  {
    id: "sc-3",
    section: "sentence_completion",
    sectionHe: SAMPLE_SECTION_LABELS.sentence_completion,
    scored: true,
    stem: "The new law is expected to have a significant ______ on the economy.",
    options: ["affect", "effect", "result", "cause"],
    correct: 1,
    explanationHe:
      "אחרי a significant חייב לבוא שם עצם. affect הוא פועל; effect הוא שם עצם, וגם הצירוף הקבוע have an effect on. result הוא שם עצם, אבל have a result on אינו צירוף טבעי; cause מדבר על מה שגרם לחוק, לא על מה שיקרה בגללו.",
  },
  {
    id: "rs-1",
    section: "restatement",
    sectionHe: SAMPLE_SECTION_LABELS.restatement,
    scored: true,
    stem: "Original: Although the project was complicated, the team completed it on time.",
    options: [
      "The project was not complicated, so the team finished it easily.",
      "The team finished the project on time, despite its complexity.",
      "The project took longer than expected because it was complicated.",
      "The team could not complete the complicated project in time.",
    ],
    correct: 1,
    explanationHe:
      "although = despite, complicated = complexity, completed = finished. אפשרות (B) שומרת על הניגוד ועל הסיום בזמן. (A) סותרת את המקור, (C) מוסיפה מידע שלא היה בו (took longer), ו-(D) סותרת: הצוות כן סיים.",
  },
  {
    id: "rs-2",
    section: "restatement",
    sectionHe: SAMPLE_SECTION_LABELS.restatement,
    scored: true,
    stem: "Original: Had it not been for the unexpected delay, we would have arrived on time.",
    options: [
      "We arrived on time, even though there was a delay.",
      "The delay caused us to arrive late.",
      "We had anticipated the delay and planned accordingly.",
      "Without the delay, we would have been punctual.",
    ],
    correct: 3,
    explanationHe:
      "Had it not been for X הוא היפוך של משפט תנאי שלישי: אילו לא היה עיכוב, היינו מגיעים בזמן. אפשרות (D) שומרת על אותו תנאי ועל אותה תוצאה. (A) אומרת שהגענו בזמן, וזה סותר; (B) נכונה בפועל אבל משמיטה את התנאי; (C) סותרת את unexpected.",
  },
  {
    id: "rc-1",
    section: "reading_comprehension",
    sectionHe: SAMPLE_SECTION_LABELS.reading_comprehension,
    scored: true,
    contextLabelHe: "קטע הקריאה",
    context: POCKET_PARKS,
    stem: 'What is the primary purpose of "pocket parks"?',
    options: [
      "To increase the value of nearby real estate.",
      "To provide small green spaces in urban areas for improved well-being.",
      "To replace large, traditional parks.",
      "To serve as tourist attractions.",
    ],
    correct: 1,
    explanationHe:
      "הקטע מציג בעיה, גישה מוגבלת לשטחים ירוקים בערים, ואת הפארקים הקטנים כפתרון שמטרתו רווחת התושבים. ערך נדל״ן, החלפת פארקים גדולים ותיירות לא מוזכרים בקטע, ותשובה שלא נמצאת בטקסט אינה נכונה גם אם היא נשמעת הגיונית.",
  },
  {
    id: "rc-2",
    section: "reading_comprehension",
    sectionHe: SAMPLE_SECTION_LABELS.reading_comprehension,
    scored: true,
    contextLabelHe: "אותו קטע",
    context: POCKET_PARKS,
    stem: "Based on the passage, what can be inferred about urban planning trends?",
    options: [
      "Cities are abandoning the concept of parks entirely.",
      "There is a growing recognition of nature's role in public well-being.",
      "Singapore and Copenhagen are the only cities with green spaces.",
      "Pocket parks are replacing all private gardens.",
    ],
    correct: 1,
    explanationHe:
      "שאלת הסקה: הקטע אומר שערים מתחילות להוסיף שטחים ירוקים קטנים, ומכאן הכרה גוברת בערך של טבע לבריאות. (A) הפוך; (C) מכלילה: סינגפור וקופנהגן הן דוגמאות, לא בלעדיות; (D) לא מוזכר דבר על גנים פרטיים.",
  },
  {
    id: "ls-1",
    section: "listening",
    sectionHe: SAMPLE_SECTION_LABELS.listening,
    scored: false,
    contextLabelHe: "תמליל הקטע (במבחן שומעים אותו)",
    context: TRAIN_ANNOUNCEMENT,
    stem: "Where should passengers wait?",
    options: ["Platform 2", "The café", "Platform 4", "Outside the station"],
    correct: 2,
    explanationHe:
      "שאלת פרט: המקום נאמר במפורש, may wait on Platform 4. בית הקפה הוא מסיח: הוא מוזכר בקטע, אבל כמקום לקפה ולא כמקום המתנה. עונים על מה שנאמר, לא על מה שנשמע הגיוני.",
  },
  {
    id: "wf-1",
    section: "word_formation",
    sectionHe: SAMPLE_SECTION_LABELS.word_formation,
    scored: false,
    stem: "The ______ of the new bridge took three years. (construct)",
    options: ["construct", "construction", "constructive"],
    correct: 1,
    explanationHe:
      "אחרי The ולפני of צריך שם עצם. construct הוא פועל, constructive הוא תואר; construct + ‎-ion = construction. הצעד הראשון בכל שאלת יצירת מילה הוא חלק הדיבר לפי המיקום, ורק אחריו הסיומת.",
  },
  {
    id: "gr-1",
    section: "grammar_in_context",
    sectionHe: SAMPLE_SECTION_LABELS.grammar_in_context,
    scored: false,
    stem: "By the time I arrived, they _____ (finish) dinner.",
    options: ["finished", "had finished"],
    correct: 1,
    explanationHe:
      "שיטת מילות הזמן: By the time ואחריו פעולה בעבר (arrived) מסמנים פעולה שהסתיימה לפני פעולה אחרת בעבר, כלומר past perfect: had finished.",
  },
] as const;

export const SAMPLE_QUESTIONS_INTRO_HE = [
  "עשר שאלות מתוך מדריכי השיטות של קורס ההכנה, מכל סוגי הפרקים של האמירנט: שלושת הפרקים המנוקדים ושלושה מפרקי הניסוי של 2026. בלי טיימר ובלי הרשמה. פותרים, פותחים את התשובה, וקוראים את ההסבר.",
  "השאלות כאן הן דוגמאות ממדריכי הקורס ולא ממבחני התרגול המדורגים או מהסימולציות, כדי שאלה יישארו חדשים למי שמתרגלים בקורס. הציון הרשמי נקבע רק במבחן מאל״ו.",
] as const;
