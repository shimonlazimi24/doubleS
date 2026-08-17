import { describe, expect, it } from "vitest";
import { isolateFillInBlanks, stripHtmlAnchorNoise, stripTaskListCheckboxes } from "./strip-lesson-markdown-noise";

describe("stripHtmlAnchorNoise", () => {
  it("removes <a name> anchors", () => {
    expect(stripHtmlAnchorNoise('לפני <a name="פח6"></a> אחרי')).toBe("לפני  אחרי");
  });

  it("converts details/summary blocks to visible content with a bold lead-in", () => {
    const md = [
      "<details>",
      "<summary>💡 גילוי התשובה</summary>",
      "",
      "**תשובה נכונה: (B)**",
      "",
      "הסבר על התשובה.",
      "",
      "</details>",
    ].join("\n");
    const out = stripHtmlAnchorNoise(md);
    expect(out).not.toMatch(/<\/?details|<\/?summary/i);
    expect(out).toContain("**💡 גילוי התשובה**");
    expect(out).toContain("**תשובה נכונה: (B)**");
    expect(out).toContain("הסבר על התשובה.");
  });

  it("handles a summary split across a chunked slide (orphan tags)", () => {
    expect(stripHtmlAnchorNoise("טקסט <details> עוד")).toBe("טקסט  עוד");
    expect(stripHtmlAnchorNoise("סוף </details>")).toBe("סוף ");
  });
});

describe("isolateFillInBlanks", () => {
  it("wraps _____ with LTR marks so RTL does not reorder the blank", () => {
    const out = isolateFillInBlanks("She _____ in this office since 2020.");
    expect(out).toContain("\u200E_____\u200E");
    expect(out.startsWith("She")).toBe(true);
  });

  it("leaves fenced code blanks alone", () => {
    const md = "```\nfoo _____ bar\n```\nShe _____ outside.";
    const out = isolateFillInBlanks(md);
    expect(out).toMatch(/```\nfoo _____ bar\n```/);
    expect(out).toContain("She \u200E_____\u200E outside.");
  });

  it("is idempotent when blanks are already isolated", () => {
    const once = isolateFillInBlanks("filled with _____ joy");
    expect(isolateFillInBlanks(once)).toBe(once);
  });
});

describe("stripTaskListCheckboxes", () => {
  it("strips GFM task-list checkboxes to plain bullets", () => {
    expect(stripTaskListCheckboxes("- [ ] ראשון\n- [x] שני")).toBe("- ראשון\n- שני");
  });
});
