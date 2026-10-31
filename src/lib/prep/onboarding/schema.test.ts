import { describe, expect, it } from "vitest";
import { examDateError, onboardingPayloadSchema } from "./schema";
import { buildWeeklyGoalPlan } from "./weekly-goal";

const NOW = new Date("2026-10-31T09:00:00Z");

describe("examDateError", () => {
  it("accepts today and future dates", () => {
    expect(examDateError("2026-10-31", NOW)).toBeNull();
    expect(examDateError("2027-02-01", NOW)).toBeNull();
  });

  it("allows one day of timezone slack, refuses older dates", () => {
    expect(examDateError("2026-10-30", NOW)).toBeNull();
    expect(examDateError("2026-10-20", NOW)).toMatch(/עבר/);
  });

  it("refuses malformed, impossible and far-future dates", () => {
    expect(examDateError("31/12/2026", NOW)).toBe("תאריך לא תקין");
    expect(examDateError("2026-02-30", NOW)).toBe("תאריך לא תקין");
    expect(examDateError("2062-10-31", NOW)).toMatch(/רחוק/);
  });
});

describe("onboardingPayloadSchema", () => {
  const base = {
    sortingExamDate: null,
    sortingExamDateUnknown: true,
    firstTimeExam: "yes",
    firstTimeExamOther: null,
    dailyStudyTime: "under_1h",
    dailyStudyTimeOther: null,
    heardAboutOther: null,
  };

  it("accepts the three questions with legacy fields defaulted", () => {
    const r = onboardingPayloadSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.success && r.data.institutionName).toBe("לא צוין");
  });

  it("returns Hebrew messages a learner can act on", () => {
    const noDate = onboardingPayloadSchema.safeParse({ ...base, sortingExamDateUnknown: false });
    expect(noDate.success ? "" : noDate.error.issues[0]?.message).toBe("בחרו תאריך או «עוד לא נקבע»");
    const other = onboardingPayloadSchema.safeParse({ ...base, firstTimeExam: "other" });
    expect(other.success ? "" : other.error.issues[0]?.message).toMatch(/כתבו/);
    const daily = onboardingPayloadSchema.safeParse({ ...base, dailyStudyTime: "lots" });
    expect(daily.success ? "" : daily.error.issues[0]?.message).toBe("בחרו זמן לימוד יומי");
  });
});

describe("weekly goal copy", () => {
  it("reads naturally when the learner does not know their daily time yet", () => {
    const plan = buildWeeklyGoalPlan({ sortingExamDate: null, sortingExamDateUnknown: true, dailyStudyTime: "unknown" });
    expect(plan.detail).not.toMatch(/יודע/);
  });
});
