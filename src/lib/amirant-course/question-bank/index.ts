/**
 * Question bank — **MVP: built in TS** (`build-bank.ts`). Production: sync from the same
 * schema as `adaptive-learning-schema` / `quiz_questions` with `difficulty_level` 1–6.
 */
import type { QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import type { AmirantBankTopicSlug, BankQuestion } from "../types/bank-question";
import { buildAmirantQuestionBank } from "./build-bank";
import type { VocabQuizMode } from "./vocab-quiz-mode";
export type { VocabQuizMode } from "./vocab-quiz-mode";
export { amirantExamQuestionPromptForDisplay } from "./prompt-for-display";
import { getResolvedAmirantProductionContent, getAmirantContentMode } from "../content-source/resolved-content";

/**
 * Explicit source split:
 * - production: imported validated content package
 * - demo: generated fallback bank (`build-bank.ts`)
 */
const imported = getResolvedAmirantProductionContent();
export const AMIRANT_CONTENT_MODE: "production" | "demo" = getAmirantContentMode();
export const AMIRANT_BANK_QUESTIONS: BankQuestion[] =
  imported?.questionBank ?? buildAmirantQuestionBank();

const BY_ID = new Map(AMIRANT_BANK_QUESTIONS.map((q) => [q.id, q]));

export function getBankQuestion(id: string): BankQuestion | undefined {
  return BY_ID.get(id);
}

export function bankQuestionsToPoolItems(questions: BankQuestion[]): QuestionPoolItem[] {
  return questions.map((q) => ({
    questionId: q.id,
    topicId: q.topicSlug,
    subtopicId: q.subtopicSlug,
    difficultyLevel: q.difficulty,
  }));
}

export const AMIRANT_QUESTION_POOL: QuestionPoolItem[] = bankQuestionsToPoolItems(AMIRANT_BANK_QUESTIONS);

export function filterBankByTopics(topics: AmirantBankTopicSlug[]): BankQuestion[] {
  const set = new Set(topics);
  return AMIRANT_BANK_QUESTIONS.filter((q) => set.has(q.topicSlug));
}

const VOCAB_MODES: VocabQuizMode[] = ["verbs", "nouns", "adjectives", "adverbs", "phrasal"];

/**
 * מסנן שאלות `vocabulary` לפי סוג מילה (פעלים, שמות עצם, …) או מעורב.
 * במבחן שמשלב נושאים (למשל אוצר + השלמה) — מסננים רק את שאלות אוצר המילים; יתר הנושאים נשארים.
 * אם אין מספיק שאלות אחרי הסינון, חוזרים ל־`filterBankByTopics` (מעורב).
 */
export function filterBankByTopicsAndVocabMode(
  topics: AmirantBankTopicSlug[],
  vocabMode: VocabQuizMode,
): BankQuestion[] {
  const base = filterBankByTopics(topics);
  if (vocabMode === "mixed" || !topics.includes("vocabulary")) return base;
  if (!VOCAB_MODES.includes(vocabMode)) return base;
  const prefix = `vocab-${vocabMode}-`;
  const filtered = base.filter((q) => {
    if (q.topicSlug !== "vocabulary") return true;
    return q.subtopicSlug.startsWith(prefix);
  });
  const nV = filtered.filter((q) => q.topicSlug === "vocabulary").length;
  if (nV < 3) return base;
  return filtered;
}
