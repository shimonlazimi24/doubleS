/** What a word-formation lesson sends to the browser: the sentence and the base word, never the answer. */
export type WordFormationPublicItem = {
  id: string;
  n: number;
  /** The sentence with one blank, written as "________". */
  sentence: string;
  baseWord: string;
};

/** One graded answer as the grade-word route returns it. */
export type WordFormationGradeItem = {
  questionId: string;
  verdict: "empty" | "correct" | "known_mistake" | "capitalization" | "base_word" | "wrong";
  isCorrect: boolean;
  note: string | null;
  accepted: string[];
  explanation: string;
};
