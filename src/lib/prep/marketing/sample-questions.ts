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
      "Although (\"למרות ש\") מסמנת ניגוד: התרופה הייתה טובה, ובכל זאת חולים סירבו לקחת אותה. לכן התשובה היא effective (\"יעילה\"). אם התרופה הייתה מזיקה (harmful) או חסרת תועלת (useless), הסירוב היה מובן, ואין ניגוד. expensive (\"יקרה\") לא יוצרת ניגוד ברור.",
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
      "הרמז במשפט: which had expected different results (\"שציפתה לתוצאות אחרות\"). מי שציפו לתוצאות אחרות מטילים ספק בממצאים, ולכן התשובה היא questioned (\"הטילו ספק\"). accepted, announced ו-published מתאימות לנושא של מחקר, אבל לא לרמז במשפט.",
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
      "אחרי a significant צריך שם עצם. affect היא פועל, ולכן לא מתאימה. effect היא שם עצם, ו-have an effect on (\"להשפיע על\") הוא צירוף קבוע. result היא שם עצם, אבל באנגלית לא אומרים have a result on. cause (\"סיבה\") מתארת את מה שגרם למשהו, לא את מה שהחוק ישפיע עליו.",
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
      "באפשרות (B) כל חלק של המשפט המקורי נשמר: although הפכה ל-despite (שתיהן \"למרות\"), complicated הפכה ל-complexity, ו-completed הפכה ל-finished. (A) אומרת שהפרויקט לא היה מסובך, וזה סותר את המקור. (C) מוסיפה שהפרויקט התארך, וזה לא נאמר. (D) אומרת שהצוות לא סיים, אבל הוא סיים.",
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
      "Had it not been for the delay פירושו \"אלמלא העיכוב\": אילו לא היה עיכוב, היינו מגיעים בזמן. (D) אומרת בדיוק את זה: בלי העיכוב היינו מגיעים בזמן. (A) אומרת שהגענו בזמן, וזה סותר את המקור. (B) נכונה, אבל לא אומרת שבלי העיכוב היינו מגיעים בזמן. (C) אומרת שציפינו לעיכוב, אבל במקור הוא היה unexpected (\"לא צפוי\").",
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
      "הקטע מציג בעיה: לתושבי ערים אין מספיק גישה לשטחים ירוקים. הפארקים הקטנים הם הפתרון, והמטרה שלהם היא לשפר את הרווחה של התושבים. ערך של דירות, החלפה של פארקים גדולים ותיירות לא מוזכרים בקטע. תשובה שלא כתובה בקטע היא לא נכונה, גם אם היא נשמעת הגיונית.",
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
      "זו שאלת מסקנה. הקטע אומר שערים התחילו להוסיף שטחים ירוקים קטנים, ומכאן אפשר להסיק שמבינים יותר ויותר את החשיבות של טבע לרווחה. (A) אומרת את ההפך. (C) הופכת דוגמה לכלל: סינגפור וקופנהגן הן רק דוגמאות. (D) מדברת על גינות פרטיות, שלא מוזכרות בקטע.",
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
      "זו שאלת פרט, והתשובה נאמרת במפורש: may wait on Platform 4 (\"אפשר לחכות ברציף 4\"). בית הקפה הוא מלכודת: הוא מוזכר בקטע, אבל כמקום שבו מחלקים קפה, לא כמקום ההמתנה. עונים לפי מה שנאמר, לא לפי מה שנשמע הגיוני.",
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
      "אחרי The ולפני of צריך שם עצם. construct היא פועל ו-constructive היא שם תואר. מוסיפים ל-construct את הסיומת ‎-ion ומקבלים את שם העצם construction (\"בנייה\"). בכל שאלה כזו, קודם מבינים איזה סוג מילה חסר, ורק אחר כך בוחרים סיומת.",
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
      "By the time (\"עד ש\") עם פעולה בעבר (arrived) מראה שהארוחה הסתיימה לפני שהגעתי. פעולה שהסתיימה לפני פעולה אחרת בעבר נכתבת ב-past perfect: had finished.",
  },
] as const;

export const SAMPLE_QUESTIONS_INTRO_HE = [
  "עשר שאלות מתוך מדריכי השיטות של הקורס, מכל סוגי הפרקים של האמירנט: שלושת סוגי השאלות שקובעים את הציון, ושלושה מפרקי הניסוי של 2026. בלי שעון ובלי הרשמה. פותרים, פותחים את התשובה וקוראים את ההסבר.",
  "השאלות לקוחות ממדריכי הקורס, ולא ממבחני התרגול או מהסימולציות, כדי שאלה יישארו חדשים למי שלומדים בקורס. הציון הרשמי נקבע רק במבחן של מאל״ו.",
] as const;
