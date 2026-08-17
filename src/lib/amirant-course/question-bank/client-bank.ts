/**
 * Client-safe question bank — imports questions.public.json only (no answer keys).
 * Server grading uses the full bank via question-bank/index.ts.
 */
import type { QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import type { AmirantBankTopicSlug } from "../types/bank-question";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import type { BankQuestionPublic } from "./public-bank";
import type { VocabQuizMode } from "./vocab-quiz-mode";
import questionsPublicJson from "../../../../content/amirant-import/source/questions.public.json";
import passagesJson from "../../../../content/amirant-import/source/passages.json";

type SourceQ = {
  questionId: string;
  topic: AmirantBankTopicSlug;
  subtopic: string;
  difficultyLevel: number;
  questionText: string;
  options: { id: string; label: string }[];
  tags?: string[];
  passageId?: string;
};

function mapPublic(questions: SourceQ[]): BankQuestionPublic[] {
  return questions.map((q) => ({
    id: q.questionId.trim(),
    prompt: q.questionText,
    options: q.options.map((o) => ({ id: o.id, label: o.label })),
    topicSlug: q.topic,
    subtopicSlug: q.subtopic,
    difficulty: q.difficultyLevel as DifficultyLevel,
    tags: q.tags,
    passageId: q.passageId,
  }));
}

const ALL = mapPublic(questionsPublicJson as SourceQ[]);

export const AMIRANT_BANK_QUESTIONS_PUBLIC: BankQuestionPublic[] = ALL;

export const AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC: BankQuestionPublic[] = ALL.filter(
  (q) => !q.tags?.includes("simulation"),
);

const BY_ID = new Map(ALL.map((q) => [q.id, q]));

export function getPublicBankQuestion(id: string): BankQuestionPublic | undefined {
  return BY_ID.get(id);
}

export function bankQuestionsPublicToPoolItems(questions: BankQuestionPublic[]): QuestionPoolItem[] {
  return questions.map((q) => ({
    questionId: q.id,
    topicId: q.topicSlug,
    subtopicId: q.subtopicSlug,
    difficultyLevel: q.difficulty,
  }));
}

export const AMIRANT_QUESTION_POOL_PUBLIC: QuestionPoolItem[] =
  bankQuestionsPublicToPoolItems(AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC);

export function filterPublicBankByTopics(topics: AmirantBankTopicSlug[]): BankQuestionPublic[] {
  const set = new Set(topics);
  return AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC.filter((q) => set.has(q.topicSlug));
}

const VOCAB_MODES: VocabQuizMode[] = ["verbs", "nouns", "adjectives", "adverbs", "phrasal"];

export function filterPublicBankByTopicsAndVocabMode(
  topics: AmirantBankTopicSlug[],
  vocabMode: VocabQuizMode,
): BankQuestionPublic[] {
  const base = filterPublicBankByTopics(topics);
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

type PassageSource = { passageId: string; title?: string; bodyMarkdown: string };
export type ClientPassage = { id: string; title?: string; bodyMarkdown: string };

function stripBlockquoteMarkers(md: string): string {
  return md.replace(/^>[ \t]?/gm, "");
}

const PASSAGES = new Map<string, ClientPassage>(
  (passagesJson as PassageSource[]).map((p) => [
    p.passageId,
    {
      id: p.passageId,
      title: p.title,
      bodyMarkdown: stripBlockquoteMarkers(p.bodyMarkdown),
    },
  ]),
);

export function getClientPassage(passageId: string): ClientPassage | undefined {
  return PASSAGES.get(passageId);
}
