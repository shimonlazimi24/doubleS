import { describe, expect, it } from "vitest";
import { buildLessonSteps, fullHeadingForLabel, stripLeadingNumbering, type UnifiedFlowItem } from "@/components/prep/amirant-course/lesson-workspace/workspace-step";

describe("stripLeadingNumbering", () => {
  it("drops the source outline number and keeps named numbering", () => {
    expect(stripLeadingNumbering("1. פתיחה – למה הפרק הזה הכי חשוב?")).toBe("פתיחה – למה הפרק הזה הכי חשוב?");
    expect(stripLeadingNumbering("10) הפרק הבא")).toBe("הפרק הבא");
    expect(stripLeadingNumbering("3.1 מבנה הזמן")).toBe("מבנה הזמן");
    expect(stripLeadingNumbering("שיטה 1: זיהוי סוג המילה")).toBe("שיטה 1: זיהוי סוג המילה");
    expect(stripLeadingNumbering("2024 היא שנה")).toBe("2024 היא שנה");
  });
});

describe("fullHeadingForLabel", () => {
  const long = "שיטה 1: זיהוי סוג המילה החסרה (Word Class Identification) והשימוש בה";
  it("returns the full heading when the label is its shortened form", () => {
    const label = long.slice(0, 71) + "…";
    expect(fullHeadingForLabel(label, `## ${long}\n\nגוף`)).toBe(long);
  });
  it("returns nothing when the label already is the heading or the body opens elsewhere", () => {
    expect(fullHeadingForLabel("פתיחה", "## פתיחה\n\nגוף")).toBeUndefined();
    expect(fullHeadingForLabel("פתיחה…", "## משהו אחר לגמרי\n\nגוף")).toBeUndefined();
    expect(fullHeadingForLabel("פתיחה", "גוף בלי כותרת")).toBeUndefined();
  });
});

describe("buildLessonSteps", () => {
  const flow: UnifiedFlowItem[] = [
    { kind: "section", id: "s1", title: "1. פתיחה – למה זה חשוב", variant: "insight", body: "## 1. פתיחה – למה זה חשוב\n\nטקסט ארוך מספיק כדי להיות צעד בפני עצמו. ".repeat(3) },
    { kind: "gate" },
  ];
  it("ends with the closing step only and numbers no label", () => {
    const steps = buildLessonSteps(flow, { mode: "markdown", lessonId: "lesson.sc.01" });
    expect(steps[0]?.id).toBe("ws-intro");
    expect(steps.at(-1)?.kind).toBe("practice_cta");
    expect(steps.some((s) => s.id === "ws-summary" || s.id === "ws-ai")).toBe(false);
    for (const s of steps) expect(s.label).not.toMatch(/^\d+[.)]\s/);
  });
});
