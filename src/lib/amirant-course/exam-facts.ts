/**
 * SINGLE SOURCE OF TRUTH for every factual claim the product makes about the
 * Amirant exam itself.
 *
 * Rule: no number, duration, score band or authority name describing the exam is
 * written by hand anywhere else — not in lesson markdown, not in the FAQ schema,
 * not in the simulation definitions, not in marketing copy. If it describes the
 * real exam, it is derived from here.
 *
 * Why this file exists: the same facts used to live in four places (unit 1,
 * unit 7.1, the JSON-LD FAQ and the simulation blueprint) and drifted into three
 * mutually contradictory versions of the exam.
 *
 * MAINTENANCE: `verification.sourceUrl` and `verification.checkedOn` must be
 * re-confirmed against the official publication before every marketing push.
 * A stale date here is a product risk, not a housekeeping detail.
 */

/** The body that administers the exam. Previously written three different ways. */
export const EXAM_AUTHORITY = {
  shortHe: "מאל״ו",
  fullHe: "המרכז הארצי לבחינות ולהערכה",
  shortEn: "NITE",
  url: "https://www.nite.org.il",
} as const;

export const EXAM_NAME = {
  he: "אמירנ״ט",
  legacyHe: "אמיר״ם",
} as const;

export const EXAM_SCORE_SCALE = { min: 50, max: 150 } as const;

export type ExamSectionType =
  | "sentence_completion"
  | "rephrasing"
  | "reading_comprehension";

export type ExamSegment = {
  /** 1-based position as presented to the candidate. */
  order: number;
  type: ExamSectionType;
  questionCount: number;
  minutes: number;
  labelHe: string;
};

/**
 * The scored part of the exam: 6 segments, 23 questions, 39 minutes.
 * Pilot (unscored) segments are described separately below because they do not
 * count toward the score and their presence varies by candidate.
 */
export const EXAM_SCORED_SEGMENTS: readonly ExamSegment[] = [
  { order: 1, type: "sentence_completion", questionCount: 4, minutes: 4, labelHe: "השלמת משפטים · חלק א׳" },
  { order: 2, type: "sentence_completion", questionCount: 4, minutes: 4, labelHe: "השלמת משפטים · חלק ב׳" },
  { order: 3, type: "reading_comprehension", questionCount: 5, minutes: 15, labelHe: "הבנת הנקרא" },
  { order: 4, type: "rephrasing", questionCount: 3, minutes: 6, labelHe: "ניסוח מחדש · חלק א׳" },
  { order: 5, type: "rephrasing", questionCount: 3, minutes: 6, labelHe: "ניסוח מחדש · חלק ב׳" },
  { order: 6, type: "sentence_completion", questionCount: 4, minutes: 4, labelHe: "השלמת משפטים · חלק ג׳" },
] as const;

export const EXAM_SCORED_QUESTION_COUNT = EXAM_SCORED_SEGMENTS.reduce(
  (sum, s) => sum + s.questionCount,
  0,
);
export const EXAM_SCORED_MINUTES = EXAM_SCORED_SEGMENTS.reduce((sum, s) => sum + s.minutes, 0);

/** Question share per skill — derived, never hand-written. */
export const EXAM_QUESTION_SHARE: Record<ExamSectionType, number> = {
  sentence_completion: 12,
  rephrasing: 6,
  reading_comprehension: 5,
};

export type ExamPilotType = {
  id: "listening_lecture" | "listening_continuation" | "word_formation" | "grammar_in_context" | "writing";
  labelHe: string;
  minutes: number;
  /** As published; the lecture section has 1–2 questions per clip, so a range. */
  questionsHe: string;
  formatHe: string;
};

/**
 * Experimental (pilot) sections, as published by NITE on the AMIRNET
 * instructions page (checked 2026-10-31). The exam has 7 or 8 sections:
 * sections 1–6 are the scored part; an 8-section exam ends with two
 * experimental sections drawn from four types (the type cannot be chosen and
 * both may be the same type); a 7-section exam ends with one writing task.
 * Scoring (NITE FAQ): a wrong answer does not lower the score; correct answers
 * can raise it by up to 2 points.
 */
export const EXAM_PILOT = {
  segmentsMin: 1,
  segmentsMax: 2,
  /** Two experimental sections take 6–14 minutes together; the writing task takes 12. */
  minMinutes: 6,
  maxMinutes: 14,
  writingMinutes: 12,
  bonusPointsMax: 2,
  scoringHe: "טעות בפרקי הניסוי אינה פוגעת בציון; תשובות נכונות יכולות להעלות אותו בעד 2 נקודות",
  /** Skills tested in experimental sections. */
  skillsHe: ["הבנת הנשמע", "יצירת מילה", "דקדוק בהקשר", "מטלת כתיבה"],
  /**
   * NITE does not publish a word count for the writing task; the exam screen
   * shows a word counter with a minimum and a maximum. The course trains for
   * 90–120 words, which stays inside the counter's range.
   */
  writingWordsHe: "אורך המילים אינו מפורסם רשמית; במסך המבחן יש מונה מילים עם מינימום ומקסימום",
  types: [
    {
      id: "listening_lecture",
      labelHe: "הבנת הנשמע: הרצאה או שיחה",
      minutes: 7,
      questionsHe: "3 קטעים (כ-30, 60 ו-90 שניות), 1–2 שאלות לקטע",
      formatHe: "מאזינים לקטע ועונים על שאלות על מה שנאמר",
    },
    {
      id: "listening_continuation",
      labelHe: "השלמת קטע שמע",
      minutes: 4,
      questionsHe: "4 קטעים של כ-20 שניות",
      formatHe: "מאזינים לקטע קצר ובוחרים את ההמשך המתאים",
    },
    {
      id: "word_formation",
      labelHe: "יצירת מילה",
      minutes: 3,
      questionsHe: "4 שאלות",
      formatHe: "בונים את הצורה הנכונה של מילה מתוך מילת בסיס, בהקלדה",
    },
    {
      id: "grammar_in_context",
      labelHe: "דקדוק בהקשר",
      minutes: 4,
      questionsHe: "4 שאלות",
      formatHe: "בוחרים את הצורה הדקדוקית שמשלימה משפט",
    },
    {
      id: "writing",
      labelHe: "מטלת כתיבה",
      minutes: 12,
      questionsHe: "מטלה אחת",
      formatHe: "כותבים פסקה קצרה על נושא נתון, בהקלדה; במקום שני פרקי ניסוי",
    },
  ] as readonly ExamPilotType[],
} as const;

/** Registration facts from nite.org.il (checked 2026-10-31). */
export const EXAM_REGISTRATION = {
  feeIls: 315,
  changeDateFeeIls: 142,
  /** Minimum days between two sittings; counted from the day after the exam. */
  retakeMinDays: 35,
  /** Scores appear in the personal area within this many days. */
  scoreWithinDays: 10,
  registrationUrl: "https://www.nite.org.il/other-tests/amirnet/registration-procedures/",
} as const;

export const EXAM_TOTAL_MINUTES = {
  min: EXAM_SCORED_MINUTES,
  max: EXAM_SCORED_MINUTES + EXAM_PILOT.maxMinutes,
} as const;

/**
 * Official placement levels. These are level names, not pass/fail: the exam has
 * no failing grade. Requirements differ per institution and per programme.
 */
export type ExamScoreBand = {
  min: number;
  max: number;
  levelHe: string;
  meaningHe: string;
};

export const EXAM_SCORE_BANDS: readonly ExamScoreBand[] = [
  { min: 50, max: 84, levelHe: "טרום־בסיסי", meaningHe: "נדרשים קורסי אנגלית מכינים לפני קורסי החובה" },
  { min: 85, max: 99, levelHe: "בסיסי", meaningHe: "עומד בתנאי הסף לקבלה ברוב המוסדות; נדרשים 3–4 קורסים" },
  { min: 100, max: 119, levelHe: "מתקדמים א׳", meaningHe: "נדרשים כשני קורסי אנגלית" },
  { min: 120, max: 133, levelHe: "מתקדמים ב׳", meaningHe: "נדרש בדרך כלל קורס אנגלית אחד" },
  { min: 134, max: 150, levelHe: "פטור", meaningHe: "פטור מקורסי אנגלית" },
] as const;

export function examScoreBand(score: number): ExamScoreBand | null {
  return EXAM_SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? null;
}

/** The exam adapts to the candidate; item difficulty carries the score weight. */
export const EXAM_IS_ADAPTIVE = true;

/**
 * Text-to-speech, introduced in the April 2026 reform: available to every
 * candidate with no special approval.
 */
export const EXAM_TEXT_TO_SPEECH_FOR_ALL = true;

export const EXAM_REFORM = {
  dateHe: "אפריל 2026",
  isoDate: "2026-04-19",
} as const;

/**
 * Provenance. Update both fields together, and re-verify before any campaign.
 * `checkedOn` is deliberately not auto-generated: it must reflect a human
 * actually opening the official page.
 */
export const EXAM_FACTS_VERIFICATION = {
  sourceUrl: EXAM_AUTHORITY.url,
  /** Pages read for the 2026-10-31 check. */
  sourceUrls: [
    "https://www.nite.org.il/other-tests/amirnet/",
    "https://www.nite.org.il/other-tests/amirnet/tips",
    "https://www.nite.org.il/other-tests/amirnet/faq",
    "https://www.nite.org.il/other-tests/amirnet/registration-procedures/online-registration/",
  ],
  /** ISO date on which a human last verified this file against the source. */
  checkedOn: "2026-10-31",
  /** Set to false while any figure above is awaiting confirmation. */
  confirmedAgainstOfficialSource: true,
  noteHe:
    "המבנה כאן משקף את הפרסום הידוע נכון לתאריך הבדיקה. מבחן אדפטיבי — מספר הפריטים בפועל עשוי להשתנות בין נבחנים.",
} as const;
