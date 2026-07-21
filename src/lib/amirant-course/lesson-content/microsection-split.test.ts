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

  it("keeps a fenced code block whole even with blank lines inside", () => {
    const fence = [
      "```",
      'Original: "She usually goes to bed at 10 PM."',
      "",
      "(A) She never goes to bed before 10 PM.",
      "(B) She typically sleeps after 10 PM.",
      "(C) She generally goes to sleep at 10 PM.",
      "(D) She sometimes goes to bed at 10 PM.",
      "```",
    ].join("\n");
    const body = `${fence}\n\nניתוח קצר של השאלה.`;
    const parts = splitBodyIntoMicroParts(body, 120);
    const withFence = parts.filter((p) => p.includes("```"));
    expect(withFence).toHaveLength(1);
    expect(withFence[0]!.match(/```/g)).toHaveLength(2);
    expect(withFence[0]).toContain("(D) She sometimes");
  });

  it("prefers sentence-end cuts for long prose (no mid-sentence break)", () => {
    const sentence = "This is a complete English sentence about pocket parks. ";
    const long = sentence.repeat(20).trim();
    const parts = splitBodyIntoMicroParts(long, 200);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) {
      expect(p.trim().endsWith(".")).toBe(true);
    }
  });
});

describe("splitBodyIntoSemanticMicroParts", () => {
  it("does not treat a ### inside a code fence as a split point", () => {
    const body = [
      "### דוגמה 1",
      "טקסט פתיחה.",
      "",
      "```",
      "### not a heading",
      "code line",
      "```",
      "",
      "סיום קצר.",
    ].join("\n");
    const parts = splitBodyIntoSemanticMicroParts(body, 400, "חלק ד'");
    expect(parts).toHaveLength(1);
    expect(parts[0]!.body).toContain("### not a heading");
    expect(parts[0]!.stepLabel).toMatch(/דוגמה 1/);
  });

  it("keeps a question subsection (fence + analysis ≤ whole-unit cap) on one slide", () => {
    const body = [
      "### שאלה 1",
      "```",
      'Original: "I wish I had studied harder."',
      "",
      "(A) option one",
      "(B) option two",
      "```",
      "",
      "**תשובה נכונה: (B)**",
      "",
      "הסבר קצר על התשובה הנכונה ולמה השאר שגויות.",
    ].join("\n");
    const parts = splitBodyIntoSemanticMicroParts(body, 300, "תרגול מיני");
    expect(parts).toHaveLength(1);
    expect(parts[0]!.body).toContain("(B) option two");
    expect(parts[0]!.body).toContain("תשובה נכונה");
  });

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
