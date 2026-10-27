/**
 * The adaptive simulation: one attempt assembled live from the owner's pool
 * with the owner's rules (content/amirant-import/owner/simulation-pool/*.json,
 * part א of the pool document).
 *
 * Client-safe: types only.
 */

export type PoolItemType =
  | "sentence_completion"
  | "restatement"
  | "reading_set"
  | "listening_lecture"
  | "word_formation"
  | "writing_task";

export type Level = 1 | 2 | 3 | 4 | 5 | 6;

/** How a section is answered: one question at a time (adaptive per answer), a set at once, or one essay. */
export type SectionMode = "single" | "set" | "writing";

export type SectionPlan = {
  index: number;
  kind: "scored" | "experimental";
  type: PoolItemType;
  mode: SectionMode;
  labelHe: string;
  questionCount: number;
  seconds: number;
};

export type ClientOption = { id: string; label: string };

/** One multiple-choice question as the browser sees it: no key, no level. */
export type ClientQuestion = {
  questionId: string;
  stem: string;
  options: ClientOption[];
  /** The passage or clip the question belongs to (reading sets, listening). */
  passageId?: string;
};

export type ClientPassage = {
  id: string;
  title: string;
  bodyMarkdown: string;
};

export type ClientWordFormation = {
  questionId: string;
  sentence: string;
  baseWord: string;
};

export type ClientWritingTask = {
  taskId: string;
  prompt: string;
  wordRange: [number, number];
};

/** What the browser needs to show the current step. */
export type ClientSection = {
  plan: SectionPlan;
  /** single: exactly one question; set: all of them. */
  questions: ClientQuestion[];
  passages: ClientPassage[];
  wordFormation: ClientWordFormation[];
  writing: ClientWritingTask | null;
  /** single mode: 1-based position of the served question in the section. */
  position: number;
  secondsLeft: number;
};

export type SectionResult = {
  index: number;
  kind: "scored" | "experimental";
  type: PoolItemType;
  labelHe: string;
  enterLevel: number;
  exitLevel: number;
  /** The level of each question as served (single mode) or of the set. */
  levelPath: number[];
  correct: number;
  total: number;
  elapsedSec: number;
};

export type WritingOutcome = {
  taskId: string;
  wordCount: number;
  content: "low" | "mid" | "high";
  language: "low" | "mid" | "high";
  whyContentHe: string;
  whyLanguageHe: string;
  workedHe: string[];
  fixHe: string[];
};

/** One band's copy from the pool document (part א §6), shown verbatim. */
export type BandFeedback = {
  min: number;
  max: number;
  labelHe: string;
  meaningHe: string;
  summaryHe: string;
  summaryEn: string;
  keepHe: string[];
  improveHe: string[];
  nextHe: string[];
};

export type SectionNote = {
  type: PoolItemType;
  labelHe: string;
  strength: "strong" | "mid" | "weak";
  accuracy: number;
  noteHe: string;
  methodHe: string;
};

export type AttemptReport = {
  /** The document's disclaimer bullets, in its order. */
  disclaimersHe: string[];
  /** Every band's meaning, for the "מה זה אומר" table. */
  bandTable: { min: number; max: number; labelHe: string; meaningHe: string }[];
  /** The band(s) the ±6 range falls in: one, or two when it crosses a boundary. */
  bandsCrossed: BandFeedback[];
  /** Per section type met in the attempt, by the type's accuracy. */
  sectionNotes: SectionNote[];
  attemptId: string | null;
  simId: string;
  startedAt: string;
  finishedAt: string;
  /** Ability on the 0.5–6.5 scale after the scored sections. */
  finalLevel: number;
  /** 50–150, before the experimental bonus. */
  baseScore: number;
  bonus: number;
  score: number;
  /** The ±6 range the learner sees. */
  low: number;
  high: number;
  bandHe: string;
  scoredCorrect: number;
  scoredTotal: number;
  experimentalAccuracy: number | null;
  sections: SectionResult[];
  writing: WritingOutcome | null;
  /** Levels the pool could not serve at the current level (nearest used instead). */
  substitutions: number;
};

export type AttemptSummary = {
  attemptId: string;
  finishedAt: string;
  score: number;
  low: number;
  high: number;
  bandHe: string;
  finalLevel: number;
};
