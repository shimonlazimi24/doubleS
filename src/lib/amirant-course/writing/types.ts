/** The exam's three levels per dimension; the task's rubric describes each. */
export type WritingLevel = "low" | "mid" | "high";

export const WRITING_LEVEL_HE: Record<WritingLevel, string> = {
  low: "נמוכה",
  mid: "בינונית",
  high: "גבוהה",
};

/** One of the task's three reference essays, shown after the learner has submitted. */
export type WritingSample = {
  level: WritingLevel;
  statedWords: number;
  essay: string;
  analysisHe: string;
  analysisEn: string;
};

export type WritingRubric = {
  content: Record<WritingLevel, string>;
  language: Record<WritingLevel, string>;
};

/** What a writing lesson sends to the browser. Gated by the lesson page (paid module). */
export type WritingTaskPublic = {
  id: string;
  n: number;
  prompt: string;
  wordRange: [number, number];
  minutes: number;
  method: { titleHe: string; bodyHe: string; bodyEn: string }[];
  usefulPhrases: string[];
  words: { word: string; pronunciation: string; meaningHe: string }[];
  rubric: WritingRubric;
  samples: WritingSample[];
};

/** The condensed guide a task's intro shows: the plan, the checklist, the final check. */
export type WritingGuidePublic = {
  planHe: string[];
  checklistHe: string[];
  finalCheckHe: string[];
  commonErrors: { insteadOf: string; write: string; noteHe: string }[];
};

export type WritingGradeResult = {
  /** Counted in code, not by the model. */
  wordCount: number;
  onTopic: boolean;
  /** Under the exam's 90-word floor: content is capped at "low". */
  tooShort: boolean;
  /** Over 150 words: noted, not penalised by the grader. */
  tooLong: boolean;
  content: { level: WritingLevel; whyHe: string };
  language: { level: WritingLevel; whyHe: string };
  workedHe: string[];
  fixHe: string[];
  upgradedSentence: { original: string; better: string; whyHe: string };
  /** Entries of the common Hebrew-speaker error list that occur in the essay. */
  flaggedErrors: { found: string; write: string; noteHe: string }[];
  model: string;
  gradedAt: string;
};

export type WritingSubmissionStatus = "grading" | "graded" | "failed";

export type WritingSubmission = {
  id: string;
  taskId: string;
  text: string;
  wordCount: number;
  status: WritingSubmissionStatus;
  result: WritingGradeResult | null;
  createdAt: string;
  gradedAt: string | null;
};

/** Daily caps, enforced on the server: the cost guard that does not slow anyone down. */
export const WRITING_LIMITS = {
  perTaskPerDay: 3,
  perUserPerDay: 10,
  /** Under this the grader does not run a model call at all. */
  minWordsToGrade: 50,
  maxChars: 3000,
} as const;

/** Words as the exam counts them: whitespace-separated tokens with at least one letter or digit. */
export function countWords(text: string): number {
  return String(text ?? "")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9֐-׿]/.test(w)).length;
}
