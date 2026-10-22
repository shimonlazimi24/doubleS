/**
 * Who may grade what, and who may see the answer.
 *
 * A question's id, stem and options reach the browser (the server serialises
 * them per page, see `question-bank/for-client.server.ts`), so the grade route
 * is the only thing standing between any visitor and the answer key. Until 2026-10-16 it revealed the
 * correct option and the full explanation of any bank question to anyone who
 * asked, the owner's paid sets and the simulations included.
 *
 * The rule, per question:
 * - demo questions (the free demo hub): grade and reveal for everyone;
 * - full access (paid / admin entitlement): grade and reveal everything;
 * - general bank, no full access: right/wrong only, and only in a batch. The
 *   free placement test is the one free flow that grades bank questions, and it
 *   grades its 15 questions once, in one batch, at the end. It needs `isCorrect`
 *   for the score and the topic breakdown and nothing else;
 * - reserved questions (simulations, the owner's graded sets), no full access:
 *   not graded at all. Only paid lessons reach them, so a request for one
 *   without access is not coming from the free UI.
 *
 * Why `check` is closed to free users on bank questions: it is a one-question
 * oracle, at most three calls to learn any answer. No free flow uses it on bank
 * questions (the placement test uses `batch`; `check` is used by the paid
 * adaptive quiz and simulation, and by the demo flow on demo ids).
 *
 * Kept free of server imports so the decision is unit-tested on its own
 * (`grade-access.test.ts`).
 */

import { isReservedForItsUnit } from "./question-bank/reserved-tags";

export type GradeMode = "check" | "batch";

export type GradeQuestionSource =
  | { kind: "demo" }
  | { kind: "bank"; tags: readonly string[] | undefined }
  | { kind: "unknown" };

export type GradeAccessDecision =
  /** Grade it and include the correct option and explanation. */
  | { grade: true; reveal: true }
  /** Grade it (right/wrong) but say nothing about the correct option. */
  | { grade: true; reveal: false }
  /** Refuse: this caller may not learn anything about this question. */
  | { grade: false; reveal: false };

/** The placement form is 15 questions; a little room for a longer reading passage. */
export const FREE_BATCH_MAX_ANSWERS = 20;

export function decideGradeAccess(params: {
  source: GradeQuestionSource;
  mode: GradeMode;
  hasFullAccess: boolean;
}): GradeAccessDecision {
  const { source, mode, hasFullAccess } = params;
  // An unknown id has no answer to protect; the route answers it as before.
  if (source.kind === "unknown") return { grade: true, reveal: true };
  if (source.kind === "demo") return { grade: true, reveal: true };
  if (hasFullAccess) return { grade: true, reveal: true };
  if (isReservedForItsUnit(source.tags)) return { grade: false, reveal: false };
  if (mode === "check") return { grade: false, reveal: false };
  return { grade: true, reveal: false };
}

/**
 * Shape limits for a batch from a caller without full access. A batch that
 * names the same question twice can try every option at once; one with more
 * questions than any free form only widens a scraper's net.
 */
export function freeBatchShapeError(questionIds: readonly string[]): "too_many" | "duplicate" | null {
  if (questionIds.length > FREE_BATCH_MAX_ANSWERS) return "too_many";
  if (new Set(questionIds).size !== questionIds.length) return "duplicate";
  return null;
}
