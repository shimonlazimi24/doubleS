/**
 * Grading one typed word-formation answer.
 *
 * The exam's rules, as the owner's tests state them: one word, letters only,
 * a different form of the base word (never the base word itself); spelling is
 * checked strictly; American and British spellings are both accepted (the key
 * lists every accepted form); a blank that opens the sentence takes a capital.
 * So comparison is case-sensitive: "unfortunately" for an opening blank is
 * wrong, and the owner lists it as a common mistake.
 *
 * What the learner gets back, in order of how specific it can be:
 * - correct;
 * - a mistake the owner anticipated, with the owner's own explanation;
 * - right word, wrong capitalization;
 * - the base word itself;
 * - wrong.
 *
 * Pure: no I/O, so it is unit-tested on its own.
 */

export type WordFormationKey = {
  baseWord: string;
  /** Every accepted form, exactly as it must be written. */
  accepted: readonly string[];
  /** Anticipated wrong forms → the owner's explanation (markdown). */
  mistakes: Readonly<Record<string, string>>;
};

export type WordVerdict = "empty" | "correct" | "known_mistake" | "capitalization" | "base_word" | "wrong";

export type WordGrade = {
  verdict: WordVerdict;
  isCorrect: boolean;
  /** What the learner typed, after the harmless clean-up below. */
  normalized: string;
  /** A note about this specific answer (markdown, Hebrew), when there is one. */
  note: string | null;
};

/**
 * Removes what is not part of the word but often comes with it: surrounding
 * spaces, hidden direction marks from a Hebrew keyboard, a trailing full stop
 * or comma, quotes. Spelling and case are left exactly as typed.
 */
export function normalizeTypedWord(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/^["'“”(\[]+|["'“”)\].,;:!?]+$/g, "")
    .trim();
}

export function gradeTypedWord(key: WordFormationKey, raw: string): WordGrade {
  const normalized = normalizeTypedWord(raw);
  const result = (verdict: WordVerdict, note: string | null = null): WordGrade => ({
    verdict,
    isCorrect: verdict === "correct",
    normalized,
    note,
  });
  if (!normalized) return result("empty");
  if (key.accepted.includes(normalized)) return result("correct");

  const exactMistake = key.mistakes[normalized];
  if (exactMistake) return result("known_mistake", exactMistake);

  const lower = normalized.toLowerCase();
  const sameWord = key.accepted.find((f) => f.toLowerCase() === lower);
  if (sameWord) {
    const opens = sameWord[0] !== sameWord[0]!.toLowerCase();
    return result(
      "capitalization",
      opens
        ? `המילה נכונה, אבל החסר פותח את המשפט, ולכן מתחילים באות גדולה: **${sameWord}**.`
        : `המילה נכונה, אבל באמצע המשפט כותבים באותיות קטנות: **${sameWord}**.`,
    );
  }

  if (lower === key.baseWord.toLowerCase()) {
    return result(
      "base_word",
      `זו מילת הבסיס עצמה. התשובה היא תמיד צורה אחרת של המילה **${key.baseWord}**: בודקים לפי המיקום במשפט איזה חלק דיבר חסר.`,
    );
  }

  const looseMistake = Object.entries(key.mistakes).find(([form]) => form.toLowerCase() === lower);
  if (looseMistake) return result("known_mistake", looseMistake[1]);

  return result("wrong");
}
