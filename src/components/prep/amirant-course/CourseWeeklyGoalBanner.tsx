"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DAILY_STUDY_OPTIONS } from "@/lib/prep/onboarding/schema";
import { buildWeeklyGoalPlan, readLocalOnboardingPayload } from "@/lib/prep/onboarding/weekly-goal";
import type { WeeklyGoalPlan } from "@/lib/prep/onboarding/weekly-goal";
import { PREP_BASE } from "@/lib/prep/constants";

type DailyStudy = (typeof DAILY_STUDY_OPTIONS)[number];

type OnboardingStatus = {
  configured?: boolean;
  completed?: boolean;
  sortingExamDate?: string | null;
  sortingExamDateUnknown?: boolean;
  dailyStudyTime?: string | null;
};

/**
 * The learner's weekly target, as two quiet lines of text rather than a framed banner.
 *
 * The account's saved answers win. Browser storage is read only when the server
 * has no database (local dev): it used to be read first, so on a shared computer
 * the next learner saw the previous one's exam date.
 */
export function CourseWeeklyGoalBanner() {
  const [plan, setPlan] = useState<WeeklyGoalPlan | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/prep/onboarding", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<OnboardingStatus>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data.configured === false) {
          const local = readLocalOnboardingPayload();
          if (local) setPlan(buildWeeklyGoalPlan(local));
          return;
        }
        const daily = data.dailyStudyTime as DailyStudy | null | undefined;
        if (!data.completed || !daily || !DAILY_STUDY_OPTIONS.includes(daily)) return;
        setCanEdit(true);
        setPlan(
          buildWeeklyGoalPlan({
            sortingExamDate: data.sortingExamDate ?? null,
            sortingExamDateUnknown: Boolean(data.sortingExamDateUnknown),
            dailyStudyTime: daily,
          }),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!plan) return null;

  return (
    <p dir="rtl" className="text-[13px] leading-relaxed text-muted" aria-label="יעד השבוע">
      <span className="font-bold text-ink">היעד השבוע: </span>
      {plan.headline.replace(/^יעד השבוע:\s*/, "")}
      {plan.detail ? `. ${plan.detail}` : ""}
      {canEdit ? (
        <>
          {" "}
          <Link
            href={`${PREP_BASE}/onboarding?edit=1&next=${encodeURIComponent(`${PREP_BASE}/amirant/course`)}`}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            עדכון התאריך
          </Link>
        </>
      ) : null}
    </p>
  );
}
