import { describe, expect, it } from "vitest";
import { parseOpenPremium, stripUnitMeta } from "./welcome-premium-extract";

describe("stripUnitMeta", () => {
  it("drops the bold metadata block of the source document", () => {
    const src = "**משך יחידה משוער:** 45-60 דקות\n**קבצים ביחידה:** 3 (מסמך + מפה)\n**רמה נדרשת:** אין – זו נקודת הפתיחה\n\n---\n\nאם אתם כאן";
    expect(stripUnitMeta(src)).toBe("אם אתם כאן");
  });

  it("drops the same fields when the page intro arrives as one plain line", () => {
    const plain =
      "משך יחידה משוער: 45-60 דקות קבצים ביחידה: 3 (מסמך ברוכים הבאים + מפת דרכים + טפסי ציפיות) רמה נדרשת: אין – זו נקודת הפתיחה מסמך 1.1: ברוכים הבאים לקורס! שלום, ומזל טוב";
    expect(stripUnitMeta(plain)).toBe("שלום, ומזל טוב");
  });
});

describe("parseOpenPremium", () => {
  it("keeps the announcing sentence before the highlight and the rest after it", () => {
    const welcome = "אם אתם כאן, זה אומר.\n\nלפני שנצלול, אני רוצה לומר משהו חשוב:\n\n> **המבחן הזה אינו מבחן על אנגלית.**\n\nבמילים אחרות: אפשר להגיע לציון מצוין.";
    const d = parseOpenPremium("", [], [welcome]);
    expect(d.intro.endsWith("משהו חשוב:")).toBe(true);
    expect(d.highlight).toBe("**המבחן הזה אינו מבחן על אנגלית.**");
    expect(d.after.startsWith("במילים אחרות")).toBe(true);
  });
});
