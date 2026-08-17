import { describe, expect, it } from "vitest";
import { stripHtmlAnchorNoise, stripTaskListCheckboxes } from "./strip-lesson-markdown-noise";

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

describe("stripTaskListCheckboxes", () => {
  it("strips GFM task-list checkboxes to plain bullets", () => {
    expect(stripTaskListCheckboxes("- [ ] ראשון\n- [x] שני")).toBe("- ראשון\n- שני");
  });
});
