import { describe, expect, it } from "vitest";
import { amirantExamQuestionPromptForDisplay } from "./prompt-for-display";

describe("amirantExamQuestionPromptForDisplay", () => {
  it("strips legacy reading-synthesis metadata that duplicates the card header", () => {
    const raw =
      "Reading synthesis (difficulty 3, item 2): which claim is most supported by a typical academic passage about replication?";
    expect(amirantExamQuestionPromptForDisplay(raw)).toBe(
      "which claim is most supported by a typical academic passage about replication?",
    );
  });

  it("leaves other prompts unchanged", () => {
    const p = "Complete: the findings _____ the hypothesis.";
    expect(amirantExamQuestionPromptForDisplay(p)).toBe(p);
  });
});
