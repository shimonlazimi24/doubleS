import { describe, expect, it } from "vitest";
import {
  cleanLessonStepSectionTitle,
  expandSectionFlowToLessonCards,
  splitBodyIntoMicroParts,
  splitBodyIntoSemanticMicroParts,
} from "./microsection-split";

describe("splitBodyIntoMicroParts", () => {
  it("returns single part for short text", () => {
    expect(splitBodyIntoMicroParts("שלום עולם.")).toEqual(["שלום עולם."]);
  });

  it("splits long multi-paragraph body at paragraph boundaries", () => {
    const a = "פסקה אחת.\n\n" + "פסקה שנייה עם עוד טקסט.\n\n" + "פסקה שלישית.";
    const long = (a + "\n\n").repeat(20);
    const parts = splitBodyIntoMicroParts(long, 200);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join("\n\n").replace(/\s+/g, " ").trim()).toContain("פסקה");
  });

  it("splits a single long paragraph into several ≤ max windows", () => {
    const one = "מילה ".repeat(400).trim();
    const parts = splitBodyIntoMicroParts(one, 120);
    expect(parts.length).toBeGreaterThan(3);
    expect(parts.every((p) => p.length <= 120)).toBe(true);
  });
});

describe("splitBodyIntoSemanticMicroParts", () => {
  it("uses each ## heading as step label (no Unit 1 · 1/3 style)", () => {
    const body = [
      "## ברוכים הבאים",
      "פסקה קצרה על הקורס.",
      "",
      "## למה צריך את המבחן?",
      "המבחן נדרש לקבלה.",
    ].join("\n");

    const parts = splitBodyIntoSemanticMicroParts(body, 400, "Unit 1: Welcome & Course Introduction");
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]!.stepLabel).toMatch(/ברוכים הבאים/);
    expect(parts.some((p) => p.stepLabel.includes("למה צריך"))).toBe(true);
    expect(parts.some((p) => p.stepLabel.includes("1/3"))).toBe(false);
  });

  it("cleans unit-style section titles for anonymous chunks", () => {
    expect(cleanLessonStepSectionTitle("Unit 1: Welcome & Course Introduction")).toBe("Welcome & Course Introduction");
  });
});

describe("expandSectionFlowToLessonCards", () => {
  it("sets stepLabel on every card", () => {
    const cards = expandSectionFlowToLessonCards({
      id: "x",
      title: "יחידה 1: מבוא",
      variant: "explanation",
      body: "## כותרת פנימית\n\nתוכן כאן.",
    });
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(cards.every((c) => c.stepLabel.length > 0)).toBe(true);
    expect(cards[0]!.stepLabel).toContain("כותרת פנימית");
  });
});
