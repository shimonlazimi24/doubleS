import { z } from "zod";
import { AMIRANT_BANK_QUESTIONS } from "@/lib/amirant-course/question-bank";
import type { AmirantBankTopicSlug, BankQuestion } from "@/lib/amirant-course/types/bank-question";
import { clampDifficultyLevel } from "@/lib/amirant-course/difficulty-clamp";
import { wilsonLowerBound } from "@/lib/learning-intelligence/analytics";

const TOPIC_SLUGS: AmirantBankTopicSlug[] = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
];

const difficultyDistributionSchema = z.record(
  z.string(),
  z.number().int().nonnegative(),
);

export const generateWeakQuizRequestSchema = z.object({
  userId: z.string().min(1),
  learner_topic_stats: z
    .array(
      z.object({
        topic: z.string().min(1),
        questionsAttempted: z.number().int().nonnegative().optional(),
        questionsCorrect: z.number().int().nonnegative().optional(),
        accuracy: z.number().min(0).max(1).optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .default([]),
  adaptive_state: z
    .array(
      z.object({
        topic: z.string().min(1),
        currentLevel: z.number().int().min(1).max(6),
        lastQuestionId: z.string().optional(),
      }),
    )
    .default([]),
});

export type GenerateWeakQuizRequest = z.infer<
  typeof generateWeakQuizRequestSchema
>;

export const generateWeakQuizResponseSchema = z.object({
  questionIds: z.array(z.string()).length(16),
  topics: z.array(
    z.enum([
      "vocabulary",
      "sentence_completion",
      "rephrasing",
      "reading_comprehension",
    ]),
  ),
  difficultyDistribution: difficultyDistributionSchema,
});

export type GenerateWeakQuizResponse = z.infer<
  typeof generateWeakQuizResponseSchema
>;

function normalizeTopic(raw: string): AmirantBankTopicSlug | null {
  const n = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (n === "vocabulary") return "vocabulary";
  if (n === "sentence_completion") return "sentence_completion";
  if (n === "sentence_rephrasing" || n === "rephrasing" || n === "restatement") {
    return "rephrasing";
  }
  if (n === "reading_comprehension") return "reading_comprehension";
  return null;
}

function pickWeakestTopics(
  stats: GenerateWeakQuizRequest["learner_topic_stats"],
): AmirantBankTopicSlug[] {
  const scored = stats
    .map((row) => {
      const topic = normalizeTopic(row.topic);
      if (!topic) return null;
      const attempted = row.questionsAttempted ?? 0;
      const correct = row.questionsCorrect ?? Math.round((row.accuracy ?? 0) * attempted);
      const wilson =
        attempted > 0 ? wilsonLowerBound(correct, attempted) : 1;
      const fallbackAccuracy = row.accuracy ?? (attempted > 0 ? correct / attempted : 1);
      const confidence = row.confidence ?? (attempted > 0 ? Math.min(1, attempted / 12) : 0);
      const weaknessScore = (1 - fallbackAccuracy) * 0.55 + (1 - wilson) * 0.35 + (1 - confidence) * 0.1;
      return { topic, weaknessScore };
    })
    .filter((x): x is { topic: AmirantBankTopicSlug; weaknessScore: number } => Boolean(x))
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  const unique: AmirantBankTopicSlug[] = [];
  for (const row of scored) {
    if (!unique.includes(row.topic)) unique.push(row.topic);
  }
  if (unique.length < 2) {
    for (const fallback of TOPIC_SLUGS) {
      if (!unique.includes(fallback)) unique.push(fallback);
      if (unique.length >= 2) break;
    }
  }
  return unique.slice(0, unique.length >= 3 ? 3 : 2);
}

function buildTopicLevelMap(
  adaptiveState: GenerateWeakQuizRequest["adaptive_state"],
): Map<AmirantBankTopicSlug, number> {
  const map = new Map<AmirantBankTopicSlug, number>();
  for (const row of adaptiveState) {
    const topic = normalizeTopic(row.topic);
    if (!topic) continue;
    map.set(topic, clampDifficultyLevel(row.currentLevel));
  }
  return map;
}

function allocateCounts(topics: AmirantBankTopicSlug[]): Record<AmirantBankTopicSlug, number> {
  if (topics.length >= 3) {
    return {
      [topics[0]]: 6,
      [topics[1]]: 5,
      [topics[2]]: 5,
    } as Record<AmirantBankTopicSlug, number>;
  }
  return {
    [topics[0]]: 8,
    [topics[1]]: 8,
  } as Record<AmirantBankTopicSlug, number>;
}

function pickByLevel(
  questions: BankQuestion[],
  targetLevel: number,
  needed: number,
  recentlySeen: Set<string>,
  used: Set<string>,
): string[] {
  const picked: string[] = [];
  const fallbackSteps = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5];

  for (const step of fallbackSteps) {
    if (picked.length >= needed) break;
    const level = clampDifficultyLevel(targetLevel + step);
    const candidates = questions
      .filter((q) => q.difficulty === level && !recentlySeen.has(q.id) && !used.has(q.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const q of candidates) {
      if (picked.length >= needed) break;
      picked.push(q.id);
      used.add(q.id);
    }
  }

  if (picked.length < needed) {
    const broader = questions
      .filter((q) => !recentlySeen.has(q.id) && !used.has(q.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const q of broader) {
      if (picked.length >= needed) break;
      picked.push(q.id);
      used.add(q.id);
    }
  }

  if (picked.length < needed) {
    const allowRecent = questions
      .filter((q) => !used.has(q.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const q of allowRecent) {
      if (picked.length >= needed) break;
      picked.push(q.id);
      used.add(q.id);
    }
  }

  return picked;
}

export function generateWeakTopicsQuiz(params: {
  input: GenerateWeakQuizRequest;
  recentQuestionIds: string[];
}): GenerateWeakQuizResponse {
  const { input, recentQuestionIds } = params;
  const topics = pickWeakestTopics(input.learner_topic_stats);
  const allocation = allocateCounts(topics);
  const levelByTopic = buildTopicLevelMap(input.adaptive_state);
  const recent = new Set(recentQuestionIds);
  for (const row of input.adaptive_state) {
    if (row.lastQuestionId) recent.add(row.lastQuestionId);
  }
  const used = new Set<string>();
  const questionIds: string[] = [];

  const availableBank = AMIRANT_BANK_QUESTIONS;

  for (const topic of topics) {
    const topicQuestions = availableBank.filter((q) => q.topicSlug === topic);
    const targetLevel = levelByTopic.get(topic) ?? 3;
    const count = allocation[topic] ?? 0;
    questionIds.push(
      ...pickByLevel(topicQuestions, targetLevel, count, recent, used),
    );
  }

  if (questionIds.length < 16) {
    const sortedAll = availableBank
      .filter((q) => !used.has(q.id) && !recent.has(q.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const q of sortedAll) {
      if (questionIds.length >= 16) break;
      questionIds.push(q.id);
      used.add(q.id);
    }
  }

  if (questionIds.length < 16) {
    const sortedAllAllowRecent = availableBank
      .filter((q) => !used.has(q.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const q of sortedAllAllowRecent) {
      if (questionIds.length >= 16) break;
      questionIds.push(q.id);
      used.add(q.id);
    }
  }

  const exact16 = questionIds.slice(0, 16);
  const byDifficulty: Record<string, number> = {};
  for (const id of exact16) {
    const q = availableBank.find((row) => row.id === id);
    if (!q) continue;
    const key = String(q.difficulty);
    byDifficulty[key] = (byDifficulty[key] ?? 0) + 1;
  }

  return generateWeakQuizResponseSchema.parse({
    questionIds: exact16,
    topics,
    difficultyDistribution: byDifficulty,
  });
}
