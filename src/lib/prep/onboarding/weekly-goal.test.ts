import { describe, expect, it } from "vitest";
import { buildWeeklyGoalPlan, daysUntilIsoDate } from "./weekly-goal";

describe("weekly-goal", () => {
  const now = new Date("2026-08-19T12:00:00");

  it("counts days until exam date", () => {
    expect(daysUntilIsoDate("2026-08-26", now)).toBe(7);
  });

  it("suggests simulation week when exam is close", () => {
    const plan = buildWeeklyGoalPlan(
      { sortingExamDate: "2026-08-24", sortingExamDateUnknown: false, dailyStudyTime: "1_3h" },
      now,
    );
    expect(plan.daysUntilExam).toBe(5);
    expect(plan.detail).toMatch(/סימולציה/);
  });

  it("uses steady pace when date unknown", () => {
    const plan = buildWeeklyGoalPlan(
      { sortingExamDate: null, sortingExamDateUnknown: true, dailyStudyTime: "under_1h" },
      now,
    );
    expect(plan.daysUntilExam).toBeNull();
    expect(plan.headline).toMatch(/קצב/);
  });
});
