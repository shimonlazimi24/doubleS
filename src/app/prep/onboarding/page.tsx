import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  PrepOnboardingWizard,
  type OnboardingInitial,
} from "@/components/prep/onboarding/PrepOnboardingWizard";
import { PREP_BRAND_LATIN } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";
import { DAILY_STUDY_OPTIONS, FIRST_TIME_OPTIONS } from "@/lib/prep/onboarding/schema";

export const metadata: Metadata = {
  title: `היכרות קצרה | ${PREP_BRAND_LATIN}`,
  robots: { index: false, follow: false },
};

type Props = { searchParams: { next?: string; edit?: string } };

function safeNext(raw: string | undefined): string {
  return raw?.startsWith("/") && !raw.startsWith("//") ? raw : `${PREP_BASE}/amirant/course`;
}

function asOption<T extends readonly string[]>(options: T, v: unknown): T[number] | "" {
  return typeof v === "string" && (options as readonly string[]).includes(v) ? (v as T[number]) : "";
}

export default async function PrepOnboardingPage({ searchParams }: Props) {
  const nextPath = safeNext(searchParams.next);
  const editing = searchParams.edit === "1";

  if (isPrepAuthBypassEnabled() && !editing) {
    redirect(nextPath);
  }

  const client = createPrepSupabaseServerClient();
  let initial: OnboardingInitial | undefined;

  // Without Supabase (local dev / demo) the form still renders; answers stay in the browser.
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      // Keep the learner's destination through the sign-in round trip.
      const self = `${PREP_BASE}/onboarding?next=${encodeURIComponent(nextPath)}${editing ? "&edit=1" : ""}`;
      redirect(`${PREP_BASE}/login?next=${encodeURIComponent(self)}`);
    }

    const { data } = await client
      .from("prep_learner_onboarding")
      .select("completed_at, sorting_exam_date, sorting_exam_date_unknown, first_time_exam, first_time_exam_other, daily_study_time")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.completed_at && !editing) {
      redirect(nextPath);
    }
    if (data?.completed_at) {
      initial = {
        sortingExamDate: data.sorting_exam_date ?? "",
        sortingExamDateUnknown: Boolean(data.sorting_exam_date_unknown),
        firstTimeExam: asOption(FIRST_TIME_OPTIONS, data.first_time_exam),
        firstTimeExamOther: data.first_time_exam_other ?? "",
        dailyStudyTime: asOption(DAILY_STUDY_OPTIONS, data.daily_study_time),
      };
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center bg-canvas px-4 py-10 sm:justify-center sm:py-16">
      <PrepOnboardingWizard nextPath={nextPath} initial={initial} editing={editing} />
    </div>
  );
}
