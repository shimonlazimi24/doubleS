import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";

export type AmirantBankTopicSlug =
  | "vocabulary"
  | "sentence_completion"
  | "rephrasing"
  | "reading_comprehension";

export interface BankQuestionOption {
  id: string;
  label: string;
}

/** Single MCQ row - source of truth for adaptive selection + UI. */
export interface BankQuestion {
  id: string;
  prompt: string;
  options: BankQuestionOption[];
  correctOptionId: string;
  explanation: string;
  topicSlug: AmirantBankTopicSlug;
  subtopicSlug: string;
  difficulty: DifficultyLevel;
  /** תגי מקור (כולל תג קבוצת החידון, למשל `sc-quiz-2-easy`) - לשיוך שאלות לשיעור. */
  tags?: string[];
  /** קטע קריאה משותף (הבנת הנקרא) - מזהה ב־passages.json. */
  passageId?: string;
}
