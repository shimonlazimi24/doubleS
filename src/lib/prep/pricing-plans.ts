export const PLAN_DAYS: Record<string, number> = {
  week: 7,
  two_weeks: 14,
  month: 30,
  ext_week: 7,
  ext_two_weeks: 14,
  ext_month: 30,
};

export const PLAN_PRICES_NIS: Record<string, number> = {
  week: 179,
  two_weeks: 229,
  month: 299,
  ext_week: 20,
  ext_two_weeks: 50,
  ext_month: 70,
};

export const PLAN_LABELS: Record<string, string> = {
  week: "גישה לשבוע",
  two_weeks: "גישה לשבועיים",
  month: "גישה לחודש",
  ext_week: "הארכה לשבוע",
  ext_two_weeks: "הארכה לשבועיים",
  ext_month: "הארכה לחודש",
};

/**
 * Extension prices are for learners finishing their prep, not a cheap way back
 * months later: they can be bought while access is active and for this many
 * days after it ends. After that, a regular plan.
 */
export const EXTENSION_GRACE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Last moment an extension can be bought, or null when access has no end date. */
export function extensionDeadline(accessEndsAt: string | null): Date | null {
  if (!accessEndsAt) return null;
  const ends = Date.parse(accessEndsAt);
  if (Number.isNaN(ends)) return null;
  return new Date(ends + EXTENSION_GRACE_DAYS * DAY_MS);
}

export function isExtensionWindowOpen(accessEndsAt: string | null, now: Date = new Date()): boolean {
  const deadline = extensionDeadline(accessEndsAt);
  return deadline == null || now.getTime() <= deadline.getTime();
}
