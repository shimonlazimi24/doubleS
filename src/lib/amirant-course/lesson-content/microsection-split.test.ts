import { describe, expect, it } from "vitest";
import {
  cleanLessonStepSectionTitle,
  expandSectionFlowToLessonCards,
  isMcOptionLine,
  isMcOptionsBlock,
  splitBodyIntoMicroParts,
  splitBodyIntoSemanticMicroParts,
  splitIntoAtomicBlocks,
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

  it("keeps unfenced (A)–(D) options together even when longer than maxChars", () => {
    const options = [
      "(A) She never goes to bed before 10 PM and this line is intentionally long.",
      "(B) She typically sleeps after 10 PM which also makes this option quite long.",
      "(C) She generally goes to sleep at 10 PM as a habit every single weeknight.",
      "(D) She sometimes goes to bed at 10 PM but not often enough to match usually.",
    ].join("\n");
    expect(options.length).toBeGreaterThan(200);
    const parts = splitBodyIntoMicroParts(`פתיח קצר.\n\n${options}\n\nסיום.`, 80);
    const withD = parts.filter((p) => /^\(D\)/m.test(p) || p.includes("\n(D)"));
    expect(withD).toHaveLength(1);
    expect(withD[0]).toContain("(A)");
    expect(withD[0]).toContain("(B)");
    expect(withD[0]).toContain("(C)");
    expect(withD[0]).toContain("(D)");
    expect(parts.some((p) => /^\(D\)/.test(p.trim()) && !p.includes("(A)"))).toBe(false);
  });

  it("packs (A)–(D) across blank lines into one atomic block", () => {
    const raw = [
      "(A) first option text here",
      "",
      "(B) second option text here",
      "",
      "(C) third option text here",
      "",
      "(D) fourth option text here",
    ].join("\n");
    const blocks = splitIntoAtomicBlocks(raw);
    expect(blocks).toHaveLength(1);
    expect(isMcOptionsBlock(blocks[0]!)).toBe(true);
    expect(blocks[0]).toContain("(D)");
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

  it("keeps blockquote paragraphs whole (no mid-sentence cut inside a quote para)", () => {
    const p1 =
      "> Despite living in the most connected era, people feel lonely. Surveys show a sharp rise across age groups.";
    const p2 =
      "> In fact, some tech companies are experimenting with features designed to foster deeper social interactions.";
    const body = `${p1}\n>\n${p2}`;
    const parts = splitBodyIntoMicroParts(body, 80);
    expect(parts.some((p) => /companies are—|companies are $/.test(p))).toBe(false);
    expect(parts.some((p) => p.includes("companies are experimenting"))).toBe(true);
    for (const part of parts) {
      const plain = part.replace(/^>\s?/gm, "").replace(/\s+/g, " ").trim();
      expect(plain.endsWith(".")).toBe(true);
    }
  });
});

describe("MC option helpers", () => {
  it("detects bare and bulleted option lines", () => {
    expect(isMcOptionLine("(A) foo")).toBe(true);
    expect(isMcOptionLine("- (B) bar")).toBe(true);
    expect(isMcOptionLine("- ❌ (C) baz")).toBe(true);
    expect(isMcOptionLine("not an option")).toBe(false);
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

  it("never leaves option (D) alone on a continuation slide", () => {
    const body = [
      "### דוגמה",
      "```",
      'Original: "Although the project was complicated, the team completed it on time."',
      "",
      "(A) The project was not complicated, so the team finished it easily.",
      "(B) The team finished the project on time, despite its complexity.",
      "(C) The project took longer than expected because it was complicated.",
      "(D) The team could not complete the complicated project in time.",
      "```",
      "",
      "**למה לא:**",
      "- (A) סותר את המקור",
      "- (B) ✅ despite = although",
      "- (C) מוסיף מידע",
      "- (D) סותר – הצוות כן סיים",
    ].join("\n");
    const parts = splitBodyIntoSemanticMicroParts(body, 300, "דוגמאות");
    for (const p of parts) {
      const b = p.body;
      if (/^\(D\)/m.test(b) || /\n\(D\)/.test(b)) {
        expect(b).toContain("(A)");
      }
    }
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
    expect(cleanLessonStepSectionTitle("Unit 1: Welcome & Course Introduction")).toBe(
      "Welcome & Course Introduction",
    );
  });

  it("keeps audio shortcode intact (not mid-token split)", () => {
    const body = [
      "## קטע שמיעה",
      "",
      "{{audio:listening-7.3-t1-p1|קטע 1}}",
      "",
      "### תמליל",
      "",
      "Hello world transcript here.",
    ].join("\n");
    const parts = splitBodyIntoSemanticMicroParts(body, 300, "שמיעה");
    const joined = parts.map((p) => p.body).join("\n");
    expect(joined).toContain("{{audio:listening-7.3-t1-p1|קטע 1}}");
    expect(joined).not.toMatch(/\{\{audio:[^}]*$/m);
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
