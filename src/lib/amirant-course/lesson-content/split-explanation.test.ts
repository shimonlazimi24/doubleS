import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS } from "../question-bank";
import { splitExplanation } from "./split-explanation";

describe("splitExplanation", () => {
  it("opens the short explanation and folds the rest for every owner question", () => {
    const owner = AMIRANT_BANK_QUESTIONS.filter((q) => q.tags?.some((t) => ["owner_sc", "owner_rs", "owner_rc"].includes(t)));
    expect(owner.length).toBeGreaterThan(200);
    for (const q of owner) {
      const parts = splitExplanation(q.explanation ?? "");
      expect(parts.short.startsWith("**הסבר קצר"), q.id).toBe(true);
      expect(parts.short.includes("הסבר מלא"), q.id).toBe(false);
      expect(parts.full?.startsWith("**הסבר מלא"), q.id).toBe(true);
      expect(parts.whyNot, q.id).toBeTruthy();
    }
  });

  it("handles the older bank format and plain text", () => {
    const old = "**Why (A) is correct:**\nbecause.\n\n**Why the other options are wrong:**\n- (B) no";
    const p = splitExplanation(old);
    expect(p.short).toBe("**Why (A) is correct:**\nbecause.");
    expect(p.full).toBeNull();
    expect(p.whyNot?.startsWith("**Why the other options are wrong:**")).toBe(true);
    expect(splitExplanation("just a line")).toEqual({ short: "just a line", full: null, whyNot: null });
  });
});
