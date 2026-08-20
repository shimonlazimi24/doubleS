import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, getBankQuestion } from "../question-bank";
import { buildPlacementQuizForm, estimatePlacementScore } from "./build-placement-quiz-form";

describe("buildPlacementQuizForm", () => {
  it("builds 15 questions in fixed order: 8 SC → 4 rephrasing → 3 RC on one passage", () => {
    const form = buildPlacementQuizForm({ bank: AMIRANT_BANK_QUESTIONS, seed: "test-seed-1" });
    expect(form.questionIds).toHaveLength(15);
    const topics = form.questionIds.map((id) => getBankQuestion(id)?.topicSlug);
    expect(topics.slice(0, 8).every((t) => t === "sentence_completion")).toBe(true);
    expect(topics.slice(8, 12).every((t) => t === "rephrasing")).toBe(true);
    expect(topics.slice(12).every((t) => t === "reading_comprehension")).toBe(true);
    expect(form.passageId).toBeTruthy();
    const rcPassages = new Set(
      form.questionIds.slice(12).map((id) => getBankQuestion(id)?.passageId),
    );
    expect(rcPassages.size).toBe(1);
    expect(rcPassages.has(form.passageId ?? undefined)).toBe(true);
  });

  it("has no duplicate questions and includes a difficulty mix", () => {
    const form = buildPlacementQuizForm({ bank: AMIRANT_BANK_QUESTIONS, seed: "test-seed-2" });
    expect(new Set(form.questionIds).size).toBe(15);
    const scDifficulties = form.questionIds
      .slice(0, 8)
      .map((id) => getBankQuestion(id)!.difficulty);
    expect(scDifficulties.some((d) => d <= 2)).toBe(true);
    expect(scDifficulties.some((d) => d >= 5)).toBe(true);
  });

  it("is deterministic for the same seed and varies across seeds", () => {
    const a = buildPlacementQuizForm({ bank: AMIRANT_BANK_QUESTIONS, seed: "same" });
    const b = buildPlacementQuizForm({ bank: AMIRANT_BANK_QUESTIONS, seed: "same" });
    const c = buildPlacementQuizForm({ bank: AMIRANT_BANK_QUESTIONS, seed: "other" });
    expect(a.questionIds).toEqual(b.questionIds);
    expect(a.questionIds).not.toEqual(c.questionIds);
  });

  it("excludes recently seen questions and passages when the pool allows", () => {
    const first = buildPlacementQuizForm({ bank: AMIRANT_BANK_QUESTIONS, seed: "round-1" });
    const second = buildPlacementQuizForm({
      bank: AMIRANT_BANK_QUESTIONS,
      seed: "round-2",
      excludeQuestionIds: new Set(first.questionIds),
      excludePassageIds: new Set(first.passageId ? [first.passageId] : []),
    });
    expect(second.passageId).not.toBe(first.passageId);
    const overlap = second.questionIds.filter((id) => first.questionIds.includes(id));
    expect(overlap).toHaveLength(0);
  });
});

describe("estimatePlacementScore", () => {
  const items = (pattern: boolean[], difficulty = 3) =>
    pattern.map((isCorrect) => ({ difficulty, isCorrect }));

  it("puts blind guessing at the bottom of the scale, not a third of the way up", () => {
    // 25% correct is chance performance on four options.
    const result = estimatePlacementScore(items([true, false, false, false].flatMap((x) => [x, x, x])));
    expect(result.score).toBeLessThanOrEqual(60);
  });

  it("weights harder items more than easy ones", () => {
    const easyCorrect = estimatePlacementScore([
      { difficulty: 1, isCorrect: true },
      { difficulty: 6, isCorrect: false },
    ]);
    const hardCorrect = estimatePlacementScore([
      { difficulty: 1, isCorrect: false },
      { difficulty: 6, isCorrect: true },
    ]);
    expect(hardCorrect.score).toBeGreaterThan(easyCorrect.score);
  });

  it("always reports a range that contains the estimate and stays on scale", () => {
    for (const correctCount of [0, 4, 8, 12, 15]) {
      const pattern = Array.from({ length: 15 }, (_, i) => i < correctCount);
      const result = estimatePlacementScore(items(pattern));
      expect(result.low).toBeLessThanOrEqual(result.score);
      expect(result.high).toBeGreaterThanOrEqual(result.score);
      expect(result.low).toBeGreaterThanOrEqual(50);
      expect(result.high).toBeLessThanOrEqual(150);
    }
  });

  it("does not claim a top-of-scale result from a 15-item form", () => {
    const perfect = estimatePlacementScore(items(Array.from({ length: 15 }, () => true), 6));
    expect(perfect.score).toBeLessThanOrEqual(145);
  });

  it("handles an empty form", () => {
    expect(estimatePlacementScore([])).toEqual({ score: 50, low: 50, high: 50 });
  });
});
