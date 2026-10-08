import { describe, expect, it } from "vitest";
import { displayOptions, isShuffleSafe, SHUFFLE_SAFE_TAG } from "./display-order";
import { AMIRANT_BANK_QUESTIONS } from "./index";

const options = [
  { id: "a", label: "one" },
  { id: "b", label: "two" },
  { id: "c", label: "three" },
  { id: "d", label: "four" },
];

describe("displayOptions", () => {
  it("keeps authoring order for questions that are not tagged shuffle-safe", () => {
    const q = { id: "q1", options, tags: ["quiz"] };
    expect(displayOptions(q, "seed-1").map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
    expect(displayOptions(q, "seed-2").map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("is a permutation: same ids, nothing lost or duplicated", () => {
    const q = { id: "q1", options, tags: [SHUFFLE_SAFE_TAG] };
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const ids = displayOptions(q, seed).map((o) => o.id);
      expect([...ids].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });

  it("is stable for one seed and varies across seeds", () => {
    const q = { id: "q1", options, tags: [SHUFFLE_SAFE_TAG] };
    expect(displayOptions(q, "same")).toEqual(displayOptions(q, "same"));
    const orders = new Set(
      Array.from({ length: 40 }, (_, i) => displayOptions(q, `s${i}`).map((o) => o.id).join("")),
    );
    expect(orders.size).toBeGreaterThan(3);
  });

  it("seeds per question, so two questions in one attempt get independent orders", () => {
    const a = { id: "q1", options, tags: [SHUFFLE_SAFE_TAG] };
    const b = { id: "q2", options, tags: [SHUFFLE_SAFE_TAG] };
    const same = Array.from({ length: 20 }, (_, i) => `s${i}`).filter(
      (s) => displayOptions(a, s).map((o) => o.id).join("") === displayOptions(b, s).map((o) => o.id).join(""),
    );
    expect(same.length).toBeLessThan(20);
  });

  /**
   * The guard that makes the tag safe to hand out: a shuffle-safe question
   * must never explain itself by letter, or the explanation would point at the
   * wrong answer after reordering.
   */
  it("no shuffle-safe question in the bank explains by letter", () => {
    const letter = /\(\s*[A-Da-d1-4]\s*\)|אפשרות [1-4א-ד]\b|תשובה [1-4א-ד]\b/;
    const offenders = AMIRANT_BANK_QUESTIONS.filter(
      (q) => isShuffleSafe(q.tags) && letter.test(q.explanation ?? ""),
    ).map((q) => q.id);
    expect(offenders).toEqual([]);
  });
});
