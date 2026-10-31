import { describe, expect, it } from "vitest";
import { createLineBreakNormalizer, normalizeModelLineBreaks } from "./model-text";

describe("normalizeModelLineBreaks", () => {
  it("turns literal backslash-n into line breaks and leaves real breaks alone", () => {
    expect(normalizeModelLineBreaks("טיפ: \\n- אחד\\n- שניים\nשלוש")).toBe("טיפ: \n- אחד\n- שניים\nשלוש");
  });

  it("does not touch ordinary text", () => {
    expect(normalizeModelLineBreaks("The word **shelter** matters.")).toBe("The word **shelter** matters.");
  });
});

describe("createLineBreakNormalizer", () => {
  it("joins a pair split across two deltas", () => {
    const n = createLineBreakNormalizer();
    expect(n.push("א\\")).toBe("א");
    expect(n.push("nב")).toBe("\nב");
    expect(n.flush()).toBe("");
  });

  it("releases a trailing backslash that was not a pair", () => {
    const n = createLineBreakNormalizer();
    expect(n.push("path\\")).toBe("path");
    expect(n.flush()).toBe("\\");
  });

  it("is a no-op on text without pairs", () => {
    const n = createLineBreakNormalizer();
    expect(n.push("שלום ") + n.push("עולם")).toBe("שלום עולם");
  });
});
