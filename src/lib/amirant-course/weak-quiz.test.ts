import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS } from "./question-bank";
import { generateWeakTopicsQuiz } from "./weak-quiz";

function idsByTopic(topic: string, count: number): string[] {
  return AMIRANT_BANK_QUESTIONS.filter((q) => q.topicSlug === topic)
    .slice(0, count)
    .map((q) => q.id);
}

describe("generateWeakTopicsQuiz", () => {
  it("returns 16 questions with weak-topic focus output", () => {
    const result = generateWeakTopicsQuiz({
      input: {
        userId: "user-1",
        learner_topic_stats: [
          {
            topic: "vocabulary",
            questionsAttempted: 20,
            questionsCorrect: 9,
            accuracy: 0.45,
            confidence: 0.9,
          },
          {
            topic: "rephrasing",
            questionsAttempted: 15,
            questionsCorrect: 7,
            accuracy: 0.46,
            confidence: 0.8,
          },
          {
            topic: "reading_comprehension",
            questionsAttempted: 10,
            questionsCorrect: 8,
            accuracy: 0.8,
            confidence: 0.8,
          },
        ],
        adaptive_state: [
          { topic: "vocabulary", currentLevel: 3 },
          { topic: "rephrasing", currentLevel: 3 },
        ],
      },
      recentQuestionIds: [],
    });

    expect(result.questionIds).toHaveLength(16);
    expect(result.topics.length).toBeGreaterThanOrEqual(2);
    expect(result.topics.length).toBeLessThanOrEqual(3);
    expect(Object.values(result.difficultyDistribution).reduce((a, b) => a + b, 0)).toBe(16);
  });

  it("avoids recently seen questions when pool is sufficient", () => {
    const recent = [
      ...idsByTopic("vocabulary", 4),
      ...idsByTopic("sentence_completion", 4),
      ...idsByTopic("rephrasing", 4),
      ...idsByTopic("reading_comprehension", 4),
    ];

    const result = generateWeakTopicsQuiz({
      input: {
        userId: "user-1",
        learner_topic_stats: [
          {
            topic: "vocabulary",
            questionsAttempted: 20,
            questionsCorrect: 8,
            accuracy: 0.4,
            confidence: 0.8,
          },
          {
            topic: "sentence_completion",
            questionsAttempted: 18,
            questionsCorrect: 7,
            accuracy: 0.39,
            confidence: 0.8,
          },
        ],
        adaptive_state: [
          { topic: "vocabulary", currentLevel: 2 },
          { topic: "sentence_completion", currentLevel: 3 },
        ],
      },
      recentQuestionIds: recent,
    });

    expect(result.questionIds).toHaveLength(16);
    expect(result.questionIds.some((id) => recent.includes(id))).toBe(false);
  });

  it("falls back to recently seen questions when unseen pool is too small", () => {
    const allIds = AMIRANT_BANK_QUESTIONS.map((q) => q.id);
    const keepUnseen = new Set(allIds.slice(0, 8));
    const recent = allIds.filter((id) => !keepUnseen.has(id));

    const result = generateWeakTopicsQuiz({
      input: {
        userId: "user-1",
        learner_topic_stats: [
          {
            topic: "vocabulary",
            questionsAttempted: 20,
            questionsCorrect: 8,
            accuracy: 0.4,
            confidence: 0.8,
          },
          {
            topic: "sentence_completion",
            questionsAttempted: 20,
            questionsCorrect: 9,
            accuracy: 0.45,
            confidence: 0.8,
          },
        ],
        adaptive_state: [
          { topic: "vocabulary", currentLevel: 3 },
          { topic: "sentence_completion", currentLevel: 3 },
        ],
      },
      recentQuestionIds: recent,
    });

    expect(result.questionIds).toHaveLength(16);
    expect(result.questionIds.some((id) => recent.includes(id))).toBe(true);
  });
});
