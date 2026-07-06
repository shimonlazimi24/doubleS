import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, getBankQuestion } from "../question-bank";
import { buildPlacementQuizForm, placementNormalizedScore } from "./build-placement-quiz-form";

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

describe("placementNormalizedScore", () => {
  it("maps percent linearly into 50–150", () => {
    expect(placementNormalizedScore(0)).toBe(50);
    expect(placementNormalizedScore(50)).toBe(100);
    expect(placementNormalizedScore(100)).toBe(150);
    expect(placementNormalizedScore(120)).toBe(150);
    expect(placementNormalizedScore(-5)).toBe(50);
  });
});
