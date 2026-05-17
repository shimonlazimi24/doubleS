import { describe, expect, it } from "vitest";
import { validateAiGroundedNumericClaims } from "./safety";

describe("validateAiGroundedNumericClaims", () => {
  it("accepts grounded numeric claims", () => {
    const res = validateAiGroundedNumericClaims({
      texts: ["score: 72, accuracy: 68%"],
      allowedSnapshots: [{ latestScorePct: 72, recentAccuracy: 68 }],
    });
    expect(res.ok).toBe(true);
    expect(res.violations).toEqual([]);
  });

  it("rejects invented numeric claims", () => {
    const res = validateAiGroundedNumericClaims({
      texts: ["score: 95%"],
      allowedSnapshots: [{ latestScorePct: 72 }],
    });
    expect(res.ok).toBe(false);
    expect(res.violations).toContain("95");
  });

  it("rejects when grounding snapshots are missing", () => {
    const res = validateAiGroundedNumericClaims({
      texts: ["דיוק: 80%"],
      allowedSnapshots: [],
    });
    expect(res.ok).toBe(false);
    expect(res.violations.length).toBeGreaterThan(0);
  });
});
