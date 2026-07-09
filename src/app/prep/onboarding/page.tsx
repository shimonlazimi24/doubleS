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
  if (isPrepAuthBypassEnabled()) {
    redirect(searchParams.next?.startsWith("/") ? searchParams.next : `${PREP_BASE}/amirant/course`);
  }

  const client = createPrepSupabaseServerClient();
  if (!client) {
    redirect(`${PREP_BASE}/login?next=${encodeURIComponent(`${PREP_BASE}/onboarding`)}`);
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    redirect(`${PREP_BASE}/login?next=${encodeURIComponent(`${PREP_BASE}/onboarding`)}`);
  }

  const completed = await hasCompletedPrepOnboarding(client, user.id);
  const nextPath =
    searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//")
      ? searchParams.next
      : `${PREP_BASE}/amirant/course`;

  if (completed) {
    redirect(nextPath);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <h1 className="mb-2 text-center text-2xl font-bold md:text-3xl">בואו נכיר - כמה שאלות קצרות</h1>
        <p className="mb-8 text-center text-muted-foreground">
          כדי להתאים את ההכנה שלך למבחן האנגלית
        </p>
        <PrepOnboardingWizard nextPath={nextPath} />
      </div>
    </div>
  );
}
