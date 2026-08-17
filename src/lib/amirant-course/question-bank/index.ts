/**
 * Question bank - **MVP: built in TS** (`build-bank.ts`). Production: sync from the same
 * schema as `adaptive-learning-schema` / `quiz_questions` with `difficulty_level` 1–6.
 */
import type { QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import type { AmirantBankTopicSlug, BankQuestion } from "../types/bank-question";
import { buildAmirantQuestionBank } from "./build-bank";
import type { VocabQuizMode } from "./vocab-quiz-mode";
export type { VocabQuizMode } from "./vocab-quiz-mode";
export { amirantExamQuestionPromptForDisplay } from "./prompt-for-display";
import {
  getResolvedAmirantPassages,
  getAmirantContentMode,
  getResolvedAmirantQuestionBank,
} from "../content-source/resolved-content";

export { getResolvedAmirantPassages };
export type { AmirantPassage } from "../content-source/resolved-content";

export const AMIRANT_CONTENT_MODE: "production" | "demo" = getAmirantContentMode();

/**
 * הבנק: שאלות אמיתיות מיובאות; שורות demo סינתטיות רק כמילוי לנושאים שחסרים
 * במאגר האמיתי (וכשכל הנושאים מכוסים - ה-demo לא נבנה בכלל). ה-mode נגזר
 * מאותה החלטה עצמה - לא מביטוי מקביל שעלול לסטות ממנה.
 */
function buildMergedBank(): { bank: BankQuestion[]; mode: "production" | "demo" } {
  const realBank = getResolvedAmirantQuestionBank();
  if (!realBank?.length) return { bank: buildAmirantQuestionBank(), mode: "demo" };
  const realTopics = new Set(realBank.map((q) => q.topicSlug));
  const allTopics: AmirantBankTopicSlug[] = ["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"];
  if (allTopics.every((t) => realTopics.has(t))) return { bank: realBank, mode: "production" };
  const fillers = buildAmirantQuestionBank().filter((q) => !realTopics.has(q.topicSlug));
  return { bank: [...realBank, ...fillers], mode: "production" };
}

const merged = buildMergedBank();

/** "production" - הבנק האמיתי פעיל (גם אם המניפסט demo); "demo" - fallback סינתטי בלבד. */
export const AMIRANT_BANK_MODE: "production" | "demo" = merged.mode;

export const AMIRANT_BANK_QUESTIONS: BankQuestion[] = merged.bank;

/**
 * הבנק לחידונים/תרגולים רגילים - בלי שאלות הסימולציות: הן שמורות לשיעורי
 * הסימולציה (getBankQuestionsByTag), ואם יופיעו בחידון רגיל הן "ישרפו" את
 * הסימולציה שהתלמיד יפגוש אחר כך.
 */
export const AMIRANT_GENERAL_BANK_QUESTIONS: BankQuestion[] = AMIRANT_BANK_QUESTIONS.filter(
  (q) => !q.tags?.includes("simulation"),
);

const BY_ID = new Map(AMIRANT_BANK_QUESTIONS.map((q) => [q.id, q]));

export function getBankQuestion(id: string): BankQuestion | undefined {
  return BY_ID.get(id);
}

export {
  toPublicBankQuestion,
  type BankQuestionPublic,
} from "./public-bank";
import { toPublicBankQuestion, type BankQuestionPublic } from "./public-bank";

/** Client-safe bank — no correctOptionId / explanation. */
export const AMIRANT_BANK_QUESTIONS_PUBLIC: BankQuestionPublic[] =
  AMIRANT_BANK_QUESTIONS.map(toPublicBankQuestion);

export const AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC: BankQuestionPublic[] =
  AMIRANT_GENERAL_BANK_QUESTIONS.map(toPublicBankQuestion);

const BY_ID_PUBLIC = new Map(AMIRANT_BANK_QUESTIONS_PUBLIC.map((q) => [q.id, q]));

export function getPublicBankQuestion(id: string): BankQuestionPublic | undefined {
  return BY_ID_PUBLIC.get(id);
}

/** קטע קריאה לפי מזהה (הבנת הנקרא). */
export function getPassage(passageId: string) {
  return getResolvedAmirantPassages().get(passageId);
}

// אינדקס תגים - נבנה עצלנית בקריאה הראשונה (הבנק אימוטבילי בזמן ריצה)
let byTag: Map<string, BankQuestion[]> | undefined;

/** שאלות בנק לפי תג קבוצה (למשל `sc-quiz-2-easy`) - לשיוך שאלות לשיעור. */
export function getBankQuestionsByTag(tag: string): BankQuestion[] {
  if (!byTag) {
    byTag = new Map();
    for (const q of AMIRANT_BANK_QUESTIONS) {
      for (const t of q.tags ?? []) {
        const list = byTag.get(t);
        if (list) list.push(q);
        else byTag.set(t, [q]);
      }
    }
  }
  return byTag.get(tag) ?? [];
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
  return AMIRANT_GENERAL_BANK_QUESTIONS.filter((q) => set.has(q.topicSlug));
}

const VOCAB_MODES: VocabQuizMode[] = ["verbs", "nouns", "adjectives", "adverbs", "phrasal"];

/**
 * מסנן שאלות `vocabulary` לפי סוג מילה (פעלים, שמות עצם, …) או מעורב.
 * במבחן שמשלב נושאים (למשל אוצר + השלמה) - מסננים רק את שאלות אוצר המילים; יתר הנושאים נשארים.
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
