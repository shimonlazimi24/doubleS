/**
 * Skip session checks on protected routes when `PREP_AUTH_BYPASS=1`.
 * Disabled on Vercel production (`VERCEL_ENV === "production"`).
 *
 * Still enabled on Vercel preview if the var is set - use only with trusted preview envs.
 */
export function isPrepAuthBypassEnabled(): boolean {
  return process.env.PREP_AUTH_BYPASS === "1" && process.env.VERCEL_ENV !== "production";
}
