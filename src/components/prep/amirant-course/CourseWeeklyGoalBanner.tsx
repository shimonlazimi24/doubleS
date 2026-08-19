"use client";

import { useEffect, useState } from "react";
import { buildWeeklyGoalPlan, readLocalOnboardingPayload } from "@/lib/prep/onboarding/weekly-goal";
import type { WeeklyGoalPlan } from "@/lib/prep/onboarding/weekly-goal";

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
    <aside
      dir="rtl"
      className="rounded-2xl border border-accent/20 bg-accent-muted/40 px-5 py-4"
      aria-label="יעד השבוע"
    >
      <p className="text-xs font-semibold tracking-[0.12em] text-accent">יעד השבוע</p>
      <p className="mt-1 text-base font-bold text-primary">{plan.headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{plan.detail}</p>
    </aside>
  );
}
