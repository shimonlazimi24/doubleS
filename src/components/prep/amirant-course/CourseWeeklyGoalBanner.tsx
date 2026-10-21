"use client";

import { useEffect, useState } from "react";
import { buildWeeklyGoalPlan, readLocalOnboardingPayload } from "@/lib/prep/onboarding/weekly-goal";
import type { WeeklyGoalPlan } from "@/lib/prep/onboarding/weekly-goal";

/** The learner's weekly target, as two quiet lines of text rather than a framed banner. */
export function CourseWeeklyGoalBanner() {
  const [plan, setPlan] = useState<WeeklyGoalPlan | null>(null);

  useEffect(() => {
    const payload = readLocalOnboardingPayload();
    if (payload) {
      setPlan(buildWeeklyGoalPlan(payload));
      return;
    }
    void fetch("/api/prep/onboarding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { completed?: boolean; sortingExamDate?: string | null; sortingExamDateUnknown?: boolean; dailyStudyTime?: string | null } | null) => {
        if (!data?.completed || !data.dailyStudyTime) return;
        setPlan(
          buildWeeklyGoalPlan({
            sortingExamDate: data.sortingExamDate ?? null,
            sortingExamDateUnknown: Boolean(data.sortingExamDateUnknown),
            dailyStudyTime: data.dailyStudyTime as "under_1h" | "1_3h" | "3_6h" | "over_6h" | "unknown",
          }),
        );
      })
      .catch(() => {});
  }, []);

  if (!plan) return null;

  return (
    <p dir="rtl" className="text-[13px] leading-relaxed text-muted" aria-label="יעד השבוע">
      <span className="font-bold text-ink">היעד השבוע: </span>
      {plan.headline.replace(/^יעד השבוע:\s*/, "")}
      {plan.detail ? ` ${plan.detail}` : ""}
    </p>
  );
}
