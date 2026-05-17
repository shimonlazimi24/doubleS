import { describe, expect, it } from "vitest";
import {
  buildAdaptiveDecisionEvent,
  computeStreakState,
} from "./adaptive-telemetry";
import type { BankQuestion } from "./types/bank-question";

describe("adaptive telemetry helpers", () => {
  const q1: BankQuestion = {
    id: "q1",
    prompt: "p1",
    options: [
      { id: "a", label: "a" },
      { id: "b", label: "b" },
      { id: "c", label: "c" },
      { id: "d", label: "d" },
    ],
    correctOptionId: "a",
    explanation: "e",
    topicSlug: "vocabulary",
    subtopicSlug: "vocabulary-core",
    difficulty: 3,
  };
  const q2: BankQuestion = { ...q1, id: "q2", correctOptionId: "b" };
  const q3: BankQuestion = { ...q1, id: "q3", correctOptionId: "c" };

  it("computes streak and recent accuracy before selected index", () => {
    const answers = new Map<string, string | null>([
      ["q1", "a"],
      ["q2", "b"],
      ["q3", null],
    ]);
    const stats = computeStreakState({
      questionIds: ["q1", "q2", "q3"],
      answersByQuestionId: answers,
      bankById: new Map([
        ["q1", q1],
        ["q2", q2],
        ["q3", q3],
      ]),
      upToIndexExclusive: 2,
    });
    expect(stats.correct).toBe(2);
    expect(stats.wrong).toBe(0);
    expect(stats.recentAccuracy).toBe(1);
  });

  it("builds telemetry event with session tag", () => {
    const event = buildAdaptiveDecisionEvent({
      topic: "vocabulary",
      previousLevel: 3,
      selectedLevel: 4,
      reason: "adaptive_pick",
      streak: { correct: 1, wrong: 0 },
      sessionId: "attempt-1",
      questionId: "q1",
    });
    expect(event.reason).toContain("adaptive_pick");
    expect(event.reason).toContain("session=attempt-1");
    expect(event.questionId).toBe("q1");
  });
});
