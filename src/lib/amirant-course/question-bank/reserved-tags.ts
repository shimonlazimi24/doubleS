/**
 * Questions that belong to one timed unit and must not be drawn anywhere else.
 *
 * A simulation, or one of the content owner's graded sets, is meant to be met
 * once, cold, with a clock. If the same question turned up earlier in an
 * adaptive quiz, in the weak-topics quiz or in the free placement test, the
 * learner would arrive at the timed unit having already seen it. So these
 * stay out of the general pool and are reachable only through the lesson that
 * owns them (`getBankQuestionsByTag`).
 *
 * This file has no imports on purpose: the server bank (`index.ts`) and the
 * browser bank (`client-bank.ts`) must apply the same rule, or the two pools
 * diverge and `public-bank-parity.test.ts` fails.
 */
export const OWNER_SET_TAGS = ["owner_sc", "owner_rs", "owner_rc"] as const;
export const RESERVED_UNIT_TAGS = ["simulation", ...OWNER_SET_TAGS] as const;

export function isReservedForItsUnit(tags: readonly string[] | undefined): boolean {
  if (!tags) return false;
  return RESERVED_UNIT_TAGS.some((t) => tags.includes(t));
}

/**
 * The interactive simulation draws by topic and level from a wider pool than
 * the general bank (it may use the simulation-only items). It still must not
 * reach into the owner's sets.
 */
export function isOwnerSetQuestion(tags: readonly string[] | undefined): boolean {
  if (!tags) return false;
  return OWNER_SET_TAGS.some((t) => tags.includes(t));
}

/**
 * Tags that carry the owner's private index (solving method, theme, top-tier
 * marker, review status). The index is headed "for owners, not for learners",
 * so `toPublicBankQuestion` strips these tags from every row a page serialises
 * for the browser; `owner-sets.test.ts` checks that none survive.
 */
export function isOwnerIndexTag(tag: string): boolean {
  return (
    tag.startsWith("method:") || tag.startsWith("theme:") || tag.startsWith("owner-status:") || tag === "l6-top"
  );
}
