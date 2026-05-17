import { describe, expect, it } from "vitest";
import { plainTextLengthApprox, takeawayLineFromLessonBody } from "./takeaway-line-from-body";

describe("takeawayLineFromLessonBody", () => {
  it("returns excerpt from existing text only", () => {
    const t = takeawayLineFromLessonBody("שלום. זה משפט שני.");
    expect(t).toContain("שלום");
  });

  it("returns null for empty body", () => {
    expect(takeawayLineFromLessonBody(undefined)).toBeNull();
  });
});

describe("plainTextLengthApprox", () => {
  it("counts plain-ish length", () => {
    expect(plainTextLengthApprox("אחת שתיים")).toBeGreaterThan(0);
  });
});
