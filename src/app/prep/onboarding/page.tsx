import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrepOnboardingWizard } from "@/components/prep/onboarding/PrepOnboardingWizard";
import { PREP_BRAND_LATIN } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";
import { hasCompletedPrepOnboarding } from "@/lib/prep/onboarding/gate";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";

export const metadata: Metadata = {
  title: `התאמה אישית | ${PREP_BRAND_LATIN}`,
  robots: { index: false, follow: false },
};

type Props = { searchParams: { next?: string } };

export default async function PrepOnboardingPage({ searchParams }: Props) {
  const nextPath =
    searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
      ? searchParams.next
      : `${PREP_BASE}/amirant/course`;

  if (isPrepAuthBypassEnabled()) {
    redirect(nextPath);
  }

  const client = createPrepSupabaseServerClient();
  // בלי Supabase (פיתוח מקומי/דמו) מציגים את השאלון - התשובות נשמרות מקומית.
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      redirect(`${PREP_BASE}/login?next=${encodeURIComponent(`${PREP_BASE}/onboarding`)}`);
    }

    const completed = await hasCompletedPrepOnboarding(client, user.id);
    if (completed) {
      redirect(nextPath);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-canvas px-4 py-12">
      <PrepOnboardingWizard nextPath={nextPath} />
    </div>
  );
}
