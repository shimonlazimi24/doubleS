import { describe, expect, it } from "vitest";
import { accessState, buildLearnerRows, learnerTotals, type OnboardingRowLite } from "./learner-rows";

const NOW = Date.parse("2026-10-31T12:00:00Z");

const answers = (user_id: string, extra: Partial<OnboardingRowLite> = {}): OnboardingRowLite => ({
  user_id,
  sorting_exam_date: "2026-12-10",
  sorting_exam_date_unknown: false,
  institution_name: "לא צוין",
  field_of_study: "לא צוין",
  first_time_exam: "yes",
  first_time_exam_other: null,
  daily_study_time: "1_3h",
  daily_study_time_other: null,
  heard_about: [],
  heard_about_other: null,
  completed_at: "2026-10-20T10:00:00Z",
  ...extra,
});

describe("buildLearnerRows", () => {
  const users = [
    { id: "u1", email: "a@x.com", created_at: "2026-10-01T00:00:00Z" },
    { id: "u2", email: "b@x.com", created_at: "2026-10-25T00:00:00Z" },
    { id: "u3", email: "c@x.com", created_at: "2026-09-01T00:00:00Z" },
  ];

  const rows = buildLearnerRows(
    users,
    [answers("u1"), answers("u3", { institution_name: "הטכניון", heard_about: ["tiktok"] })],
    [
      { user_id: "u1", access_type: "paid", ends_at: "2026-11-15T00:00:00Z" },
      { user_id: "u3", access_type: "paid", ends_at: "2026-10-01T00:00:00Z" },
    ],
    NOW,
  );

  it("lists accounts that never finished the questionnaire", () => {
    const u2 = rows.find((r) => r.userId === "u2")!;
    expect(u2.onboardedAt).toBeNull();
    expect(u2.access).toBe("none");
  });

  it("sorts newest sign-up first", () => {
    expect(rows.map((r) => r.userId)).toEqual(["u2", "u1", "u3"]);
  });

  it("shows labels, hides the placeholder, keeps legacy answers", () => {
    const u1 = rows.find((r) => r.userId === "u1")!;
    expect(u1.dailyStudyTime).toBe("1-3 שעות");
    expect(u1.institution).toBe("");
    const u3 = rows.find((r) => r.userId === "u3")!;
    expect(u3.institution).toBe("הטכניון");
    expect(u3.heardAbout).toBe("טיקטוק");
  });

  it("does not count expired access as paid", () => {
    expect(rows.find((r) => r.userId === "u3")!.access).toBe("expired");
    expect(learnerTotals(rows)).toEqual({ signedUp: 3, onboarded: 2, paidActive: 1 });
  });
});

describe("accessState", () => {
  it("treats free and missing as none, open-ended paid as paid", () => {
    expect(accessState(undefined, NOW)).toBe("none");
    expect(accessState({ user_id: "x", access_type: "free", ends_at: null }, NOW)).toBe("none");
    expect(accessState({ user_id: "x", access_type: "paid", ends_at: null }, NOW)).toBe("paid");
    expect(accessState({ user_id: "x", access_type: "admin", ends_at: null }, NOW)).toBe("admin");
  });
});
