import { AMIRANT_BANK_QUESTIONS } from "./question-bank";
import type { AmirantBankTopicSlug } from "./types/bank-question";
import type { ManifestQuiz } from "./types/course-manifest";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";

export function takeQuestionIds(topic: AmirantBankTopicSlug, n: number): string[] {
  return AMIRANT_BANK_QUESTIONS.filter((q) => q.topicSlug === topic)
    .slice(0, n)
    .map((q) => q.id);
}

/** מסנן שאלות בנק לפי רמת קושי (1–6), לדוגמה מקבצי קל/בינוני/גבוה. */
export function takeQuestionIdsByDifficulty(
  topic: AmirantBankTopicSlug,
  n: number,
  minLevel: DifficultyLevel,
  maxLevel: DifficultyLevel,
): string[] {
  return AMIRANT_BANK_QUESTIONS.filter(
    (q) => q.topicSlug === topic && q.difficulty >= minLevel && q.difficulty <= maxLevel,
  )
    .slice(0, n)
    .map((q) => q.id);
}

export function buildManifestQuiz(
  id: string,
  title: string,
  topics: AmirantBankTopicSlug[],
): ManifestQuiz {
  return {
    id,
    title,
    adaptive: true,
    questionCount: 16,
    timeLimitSec: 39 * 60,
    topicSlugs: topics,
  };
}
