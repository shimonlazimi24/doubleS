import { describe, expect, it } from "vitest";
import { gradeTypedWord, normalizeTypedWord } from "./grade-word";

const mid = {
  baseWord: "behave",
  accepted: ["behavior", "behaviour"],
  mistakes: { behaving: "behaving is a verb form.", behavor: "the ending needs -ior." },
};
const opening = {
  baseWord: "fortune",
  accepted: ["Unfortunately"],
  mistakes: { unfortunately: "Right word, but it opens the sentence.", Fortunately: "needs un-." },
};

describe("gradeTypedWord", () => {
  it("accepts every listed spelling, American and British", () => {
    expect(gradeTypedWord(mid, "behavior").isCorrect).toBe(true);
    expect(gradeTypedWord(mid, "behaviour").isCorrect).toBe(true);
  });

  it("checks spelling strictly", () => {
    expect(gradeTypedWord(mid, "behavoir")).toMatchObject({ verdict: "wrong", isCorrect: false });
  });

  it("gives the owner's explanation for an anticipated mistake", () => {
    expect(gradeTypedWord(mid, "behaving")).toMatchObject({ verdict: "known_mistake", note: "behaving is a verb form." });
    expect(gradeTypedWord(mid, "Behaving")).toMatchObject({ verdict: "known_mistake" });
  });

  it("requires a capital when the blank opens the sentence, using the owner's note when there is one", () => {
    expect(gradeTypedWord(opening, "Unfortunately").isCorrect).toBe(true);
    expect(gradeTypedWord(opening, "unfortunately")).toMatchObject({
      verdict: "known_mistake",
      isCorrect: false,
      note: "Right word, but it opens the sentence.",
    });
    expect(gradeTypedWord({ ...opening, mistakes: {} }, "unfortunately")).toMatchObject({ verdict: "capitalization" });
  });

  it("marks a capital in the middle of a sentence", () => {
    const g = gradeTypedWord(mid, "Behavior");
    expect(g).toMatchObject({ verdict: "capitalization", isCorrect: false });
    expect(g.note).toContain("behavior");
  });

  it("rejects the base word itself", () => {
    expect(gradeTypedWord(mid, "behave")).toMatchObject({ verdict: "base_word", isCorrect: false });
  });

  it("treats an empty answer as unanswered", () => {
    expect(gradeTypedWord(mid, "   ")).toMatchObject({ verdict: "empty", isCorrect: false });
  });
});

describe("normalizeTypedWord", () => {
  it("drops spaces, direction marks, quotes and a trailing full stop, keeping spelling and case", () => {
    expect(normalizeTypedWord("  Behavior.  ")).toBe("Behavior");
    expect(normalizeTypedWord("‎behaviour‏")).toBe("behaviour");
    expect(normalizeTypedWord("“behavior”")).toBe("behavior");
    expect(normalizeTypedWord("behavoir")).toBe("behavoir");
  });
});
