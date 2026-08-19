import type { SupabaseClient } from "@supabase/supabase-js";
import { isGoogleOAuthEnabledInApp } from "@/lib/prep/brand";
import { hasCompletedPrepOnboarding } from "@/lib/prep/onboarding/gate";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { PREP_BASE } from "@/lib/prep/constants";

export const AMIRANT_CONTINUE_PATH = `${PREP_BASE}/amirant/continue`;
export const AMIRANT_COURSE_HOME_PATH = `${PREP_BASE}/amirant/course`;

/** אנונימיים נשלחים ישר ל-Google (בלי מסך ביניים); /prep/login נשאר לשגיאות וקוד-מייל. */
function loginUrl(nextPath: string): string {
  const target = isGoogleOAuthEnabledInApp() ? "auth/google" : "login";
  return `${PREP_BASE}/${target}?next=${encodeURIComponent(nextPath)}`;
}

function onboardingUrl(nextPath: string): string {
  return `${PREP_BASE}/onboarding?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Where «המשך לקורס» should send the learner next.
 * Login → onboarding → **course home** (free intro). Pricing is a separate CTA.
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

  return AMIRANT_COURSE_HOME_PATH;
}
