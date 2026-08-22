import type { SupabaseClient } from "@supabase/supabase-js";
import { PREP_BASE } from "@/lib/prep/constants";

const TABLE = "prep_learner_onboarding";

/**
 * Marks that this account already finished onboarding, so the middleware can
 * skip a database query on every navigation.
 *
 * Safe to trust: the cookie only decides whether to *redirect someone to the
 * onboarding form*. It grants nothing. Forging it skips a questionnaire, which
 * is not a privilege. Everything that matters — course access, payments — is
 * checked against the database and row-level security.
 *
 * Scoped to the user id so a shared device cannot carry one person's answer to
 * another's session.
 */
export const PREP_ONBOARDING_COOKIE = "prep_onboarded";

export function onboardingCookieValue(userId: string): string {
  return userId;
}

export function hasOnboardingCookie(cookieValue: string | undefined, userId: string): boolean {
  return Boolean(cookieValue) && cookieValue === userId;
}

export async function hasCompletedPrepOnboarding(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from(TABLE)
    .select("completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.completed_at) return false;
  return true;
}

/** Paths that require completed onboarding when user is authenticated. */
export function isPrepSessionRequiredPath(pathname: string): boolean {
  if (isPrepProtectedPathForOnboarding(pathname)) return true;
  if (pathname === `${PREP_BASE}/amirant/course` || pathname.startsWith(`${PREP_BASE}/amirant/course/`)) {
    return true;
  }
  return false;
}

export function isPrepOnboardingGatedPath(pathname: string): boolean {
  if (pathname.startsWith(`${PREP_BASE}/onboarding`)) return false;
  if (pathname === `${PREP_BASE}/login` || pathname.startsWith(`${PREP_BASE}/auth/`)) return false;
  if (pathname === PREP_BASE || pathname === `${PREP_BASE}/pricing`) return false;
  if (pathname === `${PREP_BASE}/blog` || pathname.startsWith(`${PREP_BASE}/blog/`)) return false;
  if (pathname === `${PREP_BASE}/toefl` || pathname === `${PREP_BASE}/about`) return false;
  if (
    pathname === `${PREP_BASE}/contact` ||
    pathname === `${PREP_BASE}/privacy` ||
    pathname === `${PREP_BASE}/terms`
  ) {
    return false;
  }

  if (pathname.startsWith(`${PREP_BASE}/amirant/course`)) return true;
  if (isPrepProtectedPathForOnboarding(pathname)) return true;
  return false;
}

function isPrepProtectedPathForOnboarding(pathname: string): boolean {
  const prefixes = [
    `${PREP_BASE}/dashboard`,
    `${PREP_BASE}/courses`,
    `${PREP_BASE}/recommendations`,
    `${PREP_BASE}/settings`,
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function prepOnboardingRedirectUrl(reqUrl: string, returnPath: string): URL {
  const url = new URL(`${PREP_BASE}/onboarding`, reqUrl);
  if (returnPath.startsWith("/") && !returnPath.startsWith("//")) {
    url.searchParams.set("next", returnPath);
  }
  return url;
}
