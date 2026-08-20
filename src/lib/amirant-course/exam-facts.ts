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

/**
 * Unscored pilot segments (post-April-2026 reform). Deliberately expressed as a
 * range: their number and content vary between candidates, and none of them
 * affects the reported score.
 */
export const EXAM_PILOT = {
  segmentsMin: 1,
  segmentsMax: 2,
  maxMinutes: 12,
  /** Skills that have been observed in pilot segments; none is scored. */
  skillsHe: ["הבנת הנשמע", "תצורת מילים", "דקדוק בהקשר", "משימת כתיבה"],
  writingWordsHe: "כ-100–150 מילים",
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
  /** ISO date on which a human last verified this file against the source. */
  checkedOn: "2026-08-20",
  /** Set to false while any figure above is awaiting confirmation. */
  confirmedAgainstOfficialSource: false,
  noteHe:
    "המבנה כאן משקף את הפרסום הידוע נכון לתאריך הבדיקה. מבחן אדפטיבי — מספר הפריטים בפועל עשוי להשתנות בין נבחנים.",
} as const;
