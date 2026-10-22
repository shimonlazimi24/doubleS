import { describe, expect, it } from "vitest";
import { buildLearnerProfileText, isRevealBlocked, resolveActiveContextForPrompt } from "./chat-context";

const key = (id: string) => (id === "q1" ? { correctOptionId: "c", explanation: "why" } : undefined);

describe("resolveActiveContextForPrompt", () => {
  it("never attaches the key to a timed question the learner has not answered", () => {
    const out = resolveActiveContextForPrompt(
      { kind: "quiz_question", text: "Q", questionId: "q1", timed: true, answered: false },
      key,
    );
    expect(out?.answerKey).toBeUndefined();
  });

  it("attaches the key once the learner answered a timed question", () => {
    const out = resolveActiveContextForPrompt(
      { kind: "quiz_question", text: "Q", questionId: "q1", timed: true, answered: true, selectedOptionId: "a" },
      key,
    );
    expect(out?.answerKey).toEqual({ correctOptionId: "c", explanation: "why" });
    expect(out?.selectedOptionId).toBe("a");
  });

  it("attaches the key for untimed practice", () => {
    const out = resolveActiveContextForPrompt({ kind: "quiz_question", text: "Q", questionId: "q1", timed: false }, key);
    expect(out?.answerKey?.correctOptionId).toBe("c");
  });

  it("lesson steps pass through without a key lookup", () => {
    const out = resolveActiveContextForPrompt({ kind: "lesson_step", text: "T", stepLabel: "הסבר" }, () => {
      throw new Error("must not be called");
    });
    expect(out).toMatchObject({ kind: "lesson_step", text: "T", stepLabel: "הסבר" });
  });
});

describe("isRevealBlocked", () => {
  it("blocks only timed + unanswered quiz questions", () => {
    expect(isRevealBlocked({ kind: "quiz_question", text: "Q", timed: true })).toBe(true);
    expect(isRevealBlocked({ kind: "quiz_question", text: "Q", timed: true, answered: true })).toBe(false);
    expect(isRevealBlocked({ kind: "quiz_question", text: "Q", timed: false })).toBe(false);
    expect(isRevealBlocked({ kind: "lesson_step", text: "T" })).toBe(false);
    expect(isRevealBlocked(undefined)).toBe(false);
  });
});

describe("buildLearnerProfileText", () => {
  it("summarises weak topics and the last quiz in one line with Hebrew topic labels", () => {
    const t = buildLearnerProfileText(
      {
        topicRollups: [
          { topic: "rephrasing", totalAnswered: 10, totalCorrect: 4 },
          { topic: "vocabulary", totalAnswered: 2, totalCorrect: 2 },
        ],
        adaptiveState: [],
      },
      { attemptId: "x", scorePct: 60, questionCount: 10, correctCount: 6, weakTopics: ["rephrasing"] },
      true,
    );
    expect(t).toContain("weak topics in last quiz: ניסוח מחדש");
    expect(t).toContain("last quiz 60% (6/10)");
    expect(t).toContain("ניסוח מחדש 40% (n=10)");
    expect(t).not.toContain("אוצר מילים"); // fewer than 3 answers - not reported
  });

  it("has fixed copy for guests and for signed-in learners without history", () => {
    expect(buildLearnerProfileText({ topicRollups: [], adaptiveState: [] }, null, false)).toBe("guest - no history.");
    expect(buildLearnerProfileText({ topicRollups: [], adaptiveState: [] }, null, true)).toBe("signed in - no quiz history yet.");
  });
});
