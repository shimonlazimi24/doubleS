import type { BankQuestion, BankQuestionOption, AmirantBankTopicSlug } from "../types/bank-question";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import { isOwnerIndexTag } from "./reserved-tags";

/**
 * Client-safe question row — never includes answer keys, explanations, or the
 * content owner's private index tags.
 */
export type BankQuestionPublic = {
  id: string;
  prompt: string;
  options: BankQuestionOption[];
  topicSlug: AmirantBankTopicSlug;
  subtopicSlug: string;
  difficulty: DifficultyLevel;
  tags?: string[];
  passageId?: string;
};

export function toPublicBankQuestion(q: BankQuestion): BankQuestionPublic {
  return {
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    topicSlug: q.topicSlug,
    subtopicSlug: q.subtopicSlug,
    difficulty: q.difficulty,
    tags: q.tags?.filter((t) => !isOwnerIndexTag(t)),
    passageId: q.passageId,
  };
}
