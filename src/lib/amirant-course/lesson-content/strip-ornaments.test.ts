import { describe, expect, it } from "vitest";
import { listInlineOptions, stripOrnaments } from "./strip-ornaments";

describe("stripOrnaments", () => {
  it("keeps bold lead-ins without the emoji", () => {
    expect(stripOrnaments("**💡 חשוב:** אם אתם תקועים – עברו הלאה.")).toBe("**חשוב:** אם אתם תקועים – עברו הלאה.");
    expect(stripOrnaments("💡 טיפ: קראו את המשפט פעמיים")).toBe("טיפ: קראו את המשפט פעמיים");
  });

  it("turns trailing verdict marks into words", () => {
    const src = "- analysis = שם עצם ❌\n- analyze = פועל בצורת בסיס ✅";
    expect(stripOrnaments(src)).toBe("- analysis = שם עצם (לא מתאים)\n- analyze = פועל בצורת בסיס (מתאים)");
  });

  it("drops ✓/✗ bullets and heading emoji, keeps the words", () => {
    expect(stripOrnaments("✗ popular — הפוך למשמעות")).toBe("popular — הפוך למשמעות");
    expect(stripOrnaments("**✓ תשובה סופית:** B")).toBe("**תשובה סופית:** B");
    expect(stripOrnaments("## 🎯 יעדי אבן דרך\n\nמוכנים למבחן! 🎓")).toBe("## יעדי אבן דרך\n\nמוכנים למבחן!");
  });

  it("leaves code fences and plain text alone", () => {
    const code = "```\n✅ keep\n```";
    expect(stripOrnaments(code)).toBe(code);
    expect(stripOrnaments("שורה רגילה בלי קישוטים")).toBe("שורה רגילה בלי קישוטים");
  });
});

describe("listInlineOptions", () => {
  it("splits a one-line example into stem and options, inside a blockquote", () => {
    const src = "> The policy was very ______; many complained. (A) popular  (B) unpopular  (C) interesting  (D) expensive";
    expect(listInlineOptions(src)).toBe(
      [
        "> The policy was very ______; many complained.",
        ">",
        "> - (A) popular",
        "> - (B) unpopular",
        "> - (C) interesting",
        "> - (D) expensive",
      ].join("\n"),
    );
  });

  it("lists an options-only line and ignores lone references", () => {
    expect(listInlineOptions("(A) cheerful  (B) sad  (C) tall  (D) hungry")).toBe(
      "- (A) cheerful\n- (B) sad\n- (C) tall\n- (D) hungry",
    );
    expect(listInlineOptions("התשובה (A) נכונה כי (B) הפוכה")).toBe("התשובה (A) נכונה כי (B) הפוכה");
  });
});
