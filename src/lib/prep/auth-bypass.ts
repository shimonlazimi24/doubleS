/**
 * Skip session checks on protected routes when `PREP_AUTH_BYPASS=1`.
 * Never in real production: Vercel production OR NODE_ENV=production outside preview.
 */
export function isPrepAuthBypassEnabled(): boolean {
  if (process.env.PREP_AUTH_BYPASS !== "1") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  // Local `next start` / Railway / etc. with NODE_ENV=production
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview") {
    return false;
  }
  return true;
}
