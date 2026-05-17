import type { SupabaseClient } from "@supabase/supabase-js";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { hasCompletedPrepOnboarding } from "@/lib/prep/onboarding/gate";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { PREP_BASE } from "@/lib/prep/constants";

export const AMIRANT_CONTINUE_PATH = `${PREP_BASE}/amirant/continue`;
export const AMIRANT_COURSE_HOME_PATH = `${PREP_BASE}/amirant/course`;

function loginUrl(nextPath: string): string {
  return `${PREP_BASE}/login?next=${encodeURIComponent(nextPath)}`;
}

function onboardingUrl(nextPath: string): string {
  return `${PREP_BASE}/onboarding?next=${encodeURIComponent(nextPath)}`;
}

function pricingUrl(courseAfterPay: string): string {
  return `${PREP_BASE}/pricing?next=${encodeURIComponent(courseAfterPay)}`;
}

/**
 * Where «המשך לקורס המלא» should send the learner next.
 * Hub + sample stay public; this path enforces login → onboarding → payment.
 */
export async function resolveAmirantContinueDestination(
  client: SupabaseClient | null,
  userId: string | null,
): Promise<string> {
  if (getPrepHasFullAccess()) return AMIRANT_COURSE_HOME_PATH;

  if (!client || !userId) {
    return loginUrl(AMIRANT_CONTINUE_PATH);
  }

  const onboardingDone = await hasCompletedPrepOnboarding(client, userId);
  if (!onboardingDone) {
    return onboardingUrl(AMIRANT_CONTINUE_PATH);
  }

  const paid = await hasAmirantFullAccess(client, userId);
  if (!paid) {
    return pricingUrl(AMIRANT_COURSE_HOME_PATH);
  }

  return AMIRANT_COURSE_HOME_PATH;
}
