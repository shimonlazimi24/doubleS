import type { BankQuestionOption } from "../types/bank-question";

/**
 * The order in which a question's options are shown.
 *
 * Option ids (`a`–`d`) are the identity that grading compares against; the
 * letter a learner sees is derived from display position. So the order can be
 * changed freely — *unless the explanation names answers by letter*. Most of
 * the imported bank does ("✅ (B) finish"), and reordering those would make
 * every explanation point at the wrong answer.
 *
 * Only questions tagged `shuffle-safe` are reordered. The content owner's
 * tests carry the tag: their explanations name the answer by word
 * ("✓ תשובה סופית: made"), so position is free to vary. Everything else keeps
 * authoring order.
 *
 * The permutation is seeded, so one attempt sees one stable order; a new seed
 * per attempt gives a new order, which is what stops a learner from
 * remembering "it was C".
 */

export const SHUFFLE_SAFE_TAG = "shuffle-safe";

export function isShuffleSafe(tags: readonly string[] | undefined): boolean {
  return tags?.includes(SHUFFLE_SAFE_TAG) ?? false;
}

/** Small deterministic PRNG (mulberry32) so a seed always yields the same order. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A seed that differs per attempt. Call once when the attempt starts. */
export function newAttemptSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Options in display order. Identity-preserving: the same option objects come
 * back, only their order changes, and only for `shuffle-safe` questions.
 */
export function displayOptions<T extends BankQuestionOption>(
  question: { id: string; options: readonly T[]; tags?: readonly string[] },
  attemptSeed: string,
): T[] {
  const options = [...question.options];
  if (!isShuffleSafe(question.tags)) return options;
  const next = rng(hash(`${attemptSeed}:${question.id}`));
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return options;
}
