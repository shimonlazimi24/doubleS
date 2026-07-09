/**
 * סילבוס מלא - קורס הכנה לאמירנט (מאל״ו).
 * «אמירם» בשיח יומיומי; המבחן הרשמי הוא אמירנט.
 *
 * כל עלה בעץ (leaf) הופך לשיעור נפרד ב־`buildAmirantCourseModules`.
 */

/** רמות קושי לתוכן ולמבחנים (1 = הכי קל, 6 = הכי קשה). */
export const AMIRANT_DIFFICULTY_MIN = 1 as const;
export const AMIRANT_DIFFICULTY_MAX = 6 as const;

export type AmirantDifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * מפרט טכני למימוש מנוע הסימולציה והקורס - **לא** חלק מסילבוס הלמידה לנבחן.
 * ראו גם `AMIRANT_SIMULATION_BUILDER_SPEC_HE` (רשימת דרישות בעברית).
 */
export const AMIRANT_SIMULATION_TECH = {
  /** אדפטיביות: אלגוריתם שינוי רמה בין פרקים (ובין מבחנים מלאים). */
  scoredQuestionsPerExam: 16,
  scoredSectionsTotalMinutes: 39,
  pilotSectionsPerExam: 1,
  difficultyScale: { min: AMIRANT_DIFFICULTY_MIN, max: AMIRANT_DIFFICULTY_MAX },
  allowNavigateBackWithinSection: true,
  adaptiveAtSectionBoundary: true,
  adaptiveBetweenFullExams: true,
  crossExamDifficultyResetRule:
    "לאחר מבחן חלש, המבחן הבא יפתח ברמת קושי נמוכה משמעותית; לאחר מבחן חזק - נקודת פתיחה גבוהה יותר, בכפוף למנוע האדפטיבי.",
  questionBankLargerThanSingleExam: true,
} as const;

/** דרישות מילוליות למפתחים - לא מוצגות כיחידות בסילבוס הקורס ללומד. */
export const AMIRANT_SIMULATION_BUILDER_SPEC_HE: readonly string[] = [
  "מבחנים אדפטיביים דורשים אלגוריתם שינוי רמה.",
  "לאחר לחיצה על תשובה חייבת להיות אפשרות לחזור אחורה ולתקן - בתוך אותו פרק עד סיום הפרק.",
  "לכל פרק (מקבץ) זמן קצוב נפרד.",
  "אדפטיביות גם בין מבחן מלא למבחן מלא: מבחן חלש → המבחן הבא נפתח ברמת קלות משמעותית (והפוך).",
  "סולם קושי 1 (הכי קל) עד 6 (הכי קשה).",
  "16 שאלות ציון לכל מבחן, מתוך בנק שאלות גדול יותר.",
  "פרק פיילוט אחד לתרגול - לא נספר בציון הסופי של הסימולציה.",
  "סה״כ ~39 דקות לפרקי האמת (ללא זמן הפיילוט).",
];

export interface SyllabusBullet {
  id: string;
  title: string;
  children?: SyllabusBullet[];
}

export interface SyllabusPart {
  id: string;
  title: string;
  bullets: SyllabusBullet[];
}

export const AMIRANT_COURSE_SYLLABUS_META = {
  courseTitleHe: "קורס הכנה - אמירנט (מיון אנגלית)",
  shortNoteHe:
    "המבחן הרשמי הוא אמירנט (מאי 2024 ואילך), יורש אמיר״ם. סולם הציונים 50–150 נשמר לרוב המוסדות.",
} as const;

/** סילבוס מלא לפי המסמך שסופק - סדר לימוד מומלץ. */
export const AMIRANT_COURSE_SYLLABUS_PARTS: SyllabusPart[] = [
  {
    id: "intro",
    title: "מבוא",
    bullets: [
      {
        id: "intro-exam-look",
        title: "איך נראה מבחן האמירנט (מבנה, פרקי אמת ופיילוט, אדפטיביות ברמת פרק)",
      },
      {
        id: "intro-scores-tracks",
        title: "סוגי ציונים (50–150) ואיך מתרגמים להקבצות אנגלית באקדמיה (פטור, מתקדמים, בסיסי וכו׳)",
      },
      { id: "intro-how-prep", title: "איך מתכוננים - עקרונות כלליים" },
      {
        id: "intro-maalau-register",
        title: "בירוקרטיה - הרשמה דרך מאל״ו: מועדים, תשלום (~275–315 ש״ח), מיקומים (ת״א, ירושלים, חיפה, באר שבע), הרשמה לפני המועד",
      },
      {
        id: "intro-institution-register",
        title: "בירוקרטיה - הרשמה דרך מוסד הלימודים: פורטל סטודנט, מחירים (~300–320 ש״ח), מועדים לפי המוסד",
      },
      {
        id: "intro-retake-rules",
        title: "מבחן חוזר: מינימום ~35 יום בין מבחני אנגלית (אמירנט/אמיר״ם/פסיכומטרי); השפעת ציון גבוה/נמוך יותר - לפי נהל מאל״ו והמוסד",
      },
      {
        id: "intro-exam-day-rules",
        title: "נהלי יום הבחינה: זהות, איסור עזרים וטלפונים, שעון פנימי לפרק",
      },
      {
        id: "intro-using-course",
        title: "איך משתמשים בקורס ההכנה שלנו (מסלול, מעקב, יעדים)",
      },
      {
        id: "intro-timeline-prep",
        title: "לו״ז הכנה נכון בהתאם לזמן שנותר עד המבחן (שבועות / ימים)",
      },
      {
        id: "intro-time-pressure",
        title: "עמידה בזמנים והתמודדות עם לחץ זמן בפרק ובמבחן כולו",
      },
    ],
  },
  {
    id: "vocab",
    title: "מילון מושגים ואוצר מילים",
    bullets: [
      { id: "vocab-glossary", title: "מילון מושגים (מונחי מבחן והנחיות)" },
      { id: "vocab-easy", title: "מילים ברמה קלה" },
      { id: "vocab-mid", title: "מילים ברמה בינונית" },
      { id: "vocab-hard", title: "מילים ברמה גבוהה (אקדמית / נדירה)" },
      { id: "vocab-flashcards", title: "כרטיסיות למידה (SRS) ומשחקי זיכרון" },
      {
        id: "vocab-self-tests",
        title: "מבחני עצמי לאוצר מילים - לפי סוג או מעורבב",
      },
    ],
  },
  {
    id: "sentence-completion",
    title: "השלמת מילים במשפט (Sentence completion)",
    bullets: [
      { id: "sc-guide", title: "מדריך כתוב + אודיו" },
      { id: "sc-video", title: "סרטון הדרכה" },
      { id: "sc-pack-easy", title: "מקבצי שאלות - רמה קלה" },
      { id: "sc-pack-mid", title: "מקבצי שאלות - רמה בינונית" },
      { id: "sc-pack-hard", title: "מקבצי שאלות - רמה גבוהה" },
      { id: "sc-pack-adaptive", title: "מקבצי מבחן - רמה משתנה (אדפטיבי)" },
    ],
  },
  {
    id: "restatement",
    title: "ניסוח משפטים מחדש (Restatement)",
    bullets: [
      { id: "rs-guide", title: "מדריך כתוב + אודיו" },
      { id: "rs-video", title: "סרטון הדרכה" },
      { id: "rs-pack-easy", title: "מקבצי שאלות - רמה קלה" },
      { id: "rs-pack-mid", title: "מקבצי שאלות - רמה בינונית" },
      { id: "rs-pack-hard", title: "מקבצי שאלות - רמה גבוהה" },
      { id: "rs-pack-adaptive", title: "מקבצי מבחן - רמה משתנה (אדפטיבי)" },
    ],
  },
  {
    id: "reading",
    title: "קטעי קריאה - הבנת הנקרא (Reading comprehension)",
    bullets: [
      { id: "rc-guide", title: "מדריך כתוב + אודיו" },
      { id: "rc-video", title: "סרטון הדרכה" },
      { id: "rc-pack-easy", title: "מקבצי שאלות - רמה קלה" },
      { id: "rc-pack-mid", title: "מקבצי שאלות - רמה בינונית" },
      { id: "rc-pack-hard", title: "מקבצי שאלות - רמה גבוהה" },
      { id: "rc-pack-adaptive", title: "מקבצי מבחן - רמה משתנה (אדפטיבי)" },
    ],
  },
  {
    id: "pilot-2026",
    title: "פרקי פיילוט והכנה לרפורמות (2026 ואילך)",
    bullets: [
      {
        id: "pilot-listening",
        title: "הבנת הנשמע (Listening): האזנה להרצאות ושיחות (30–90 שניות) ושאלות הבנה",
      },
      {
        id: "pilot-listen-gap",
        title: "השלמת קטע שמע - השלמה לוגית למשפט חסר",
      },
      {
        id: "pilot-word-formation",
        title: "יצירת מילה (Word formation): תחיליות, סופיות והטיות (פועל → תואר וכו׳) במשימות הקלדה",
      },
      {
        id: "pilot-grammar-context",
        title: "דקדוק בהקשר - מבנים תחביריים בתוך פסקה",
      },
      {
        id: "pilot-writing",
        title: "מטלת כתיבה - הכנה לטקסט עצמאי (~12 דק׳) בפורמט אקדמי",
      },
      {
        id: "pilot-scoring-note",
        title: "פיילוט: לא מוריד ציון; הצלחה יוצאת דופן עשויה להוסיף נקודה–שתיים",
      },
    ],
  },
  {
    id: "full-sims",
    title: "מבחני סימולציה מלאים וסיום הקורס",
    bullets: [
      { id: "sim-howto", title: "מדריך: איך לבצע את מבחן הסימולציה (ממשק, פרקים, פיילוט)" },
      { id: "sim-five-six", title: "לפחות 5–6 מבחנים מלאים עם קיצוב זמן לכל פרק" },
      { id: "sim-ai", title: "ניתוח מבחנים בעזרת AI" },
      { id: "sim-calc", title: "מחשבון תוצאות / הערכת ציון" },
      { id: "sim-tips", title: "טיפים מנצחים" },
      { id: "sim-before", title: "הכנה ביום לפני המבחן" },
      { id: "sim-during", title: "ניהול זמן נכון במהלך המבחן" },
      { id: "sim-techniques", title: "טכניקות ויישום שיטות כלליות" },
      { id: "sim-after", title: "מה קורה אחרי? (הגשה, ציון, מוסד)" },
      { id: "sim-summary-course", title: "סיכום הקורס" },
      { id: "sim-quiz-final", title: "שאלון סיכום" },
      { id: "sim-feedback", title: "פידבק" },
      { id: "sim-upsell", title: "מתנה וניסיון המרה לקורסי המשך" },
    ],
  },
];

export function countAmirantSyllabusLeafItems(): number {
  let n = 0;
  const walk = (b: SyllabusBullet) => {
    if (b.children?.length) b.children.forEach(walk);
    else n += 1;
  };
  for (const part of AMIRANT_COURSE_SYLLABUS_PARTS) {
    for (const b of part.bullets) walk(b);
  }
  return n;
}
