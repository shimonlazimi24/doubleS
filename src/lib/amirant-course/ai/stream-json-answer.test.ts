import { describe, expect, it } from "vitest";
import { createAnswerStreamExtractor } from "./stream-json-answer";

function feed(deltas: string[]): { visible: string; done: boolean } {
  const x = createAnswerStreamExtractor();
  let visible = "";
  for (const d of deltas) visible += x.push(d);
  return { visible, done: x.done };
}

describe("createAnswerStreamExtractor", () => {
  it("emits the answer and stops at its closing quote", () => {
    const r = feed(['{"answer":"שלום', ' עולם","intent":"question_help"}']);
    expect(r.visible).toBe("שלום עולם");
    expect(r.done).toBe(true);
  });

  it("tolerates whitespace around the colon", () => {
    expect(feed(['{"answer" : "hi"}']).visible).toBe("hi");
  });

  it("decodes escapes that are split across deltas", () => {
    const r = feed(['{"answer":"line1\\', 'nline2 \\"q\\" back\\\\slash"}']);
    expect(r.visible).toBe('line1\nline2 "q" back\\slash');
  });

  it("decodes \\u escapes, also when split", () => {
    const r = feed(['{"answer":"\\u05', 'D0\\u05D1"}']);
    expect(r.visible).toBe("אב");
  });

  it("ignores content after the answer value", () => {
    const r = feed(['{"answer":"a","recommendedAction":"not shown"}']);
    expect(r.visible).toBe("a");
    expect(r.done).toBe(true);
  });

  it("does not emit anything before the answer key appears", () => {
    const r = feed(['{"intent":"question_help","hintStage":null,', '"answer":"x"']);
    expect(r.visible).toBe("x");
  });
});
