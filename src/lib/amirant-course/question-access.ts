/**
 * Who may read which question stems from the questions API.
 *
 * Same line as `grade-access.ts` draws for answers: the general bank is free
 * to read (the placement test shows it to anyone), the reserved units — the
 * simulations and the owner's graded sets — only with full access. Those are
 * the paid product; before 2026-10-22 they shipped in the public JSON to every
 * visitor.
 *
 * Kept free of server imports so the rule is unit-tested on its own.
 */
import { isReservedForItsUnit } from "./question-bank/reserved-tags";

/** A simulation section is at most 22 questions; a weak-topics set is 16. */
export const QUESTION_SET_MAX_IDS = 40;

export function mayReadQuestion(params: { tags: readonly string[] | undefined; hasFullAccess: boolean }): boolean {
  if (params.hasFullAccess) return true;
  return !isReservedForItsUnit(params.tags);
}
