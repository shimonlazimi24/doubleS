import { selectNextQuestion } from "@/lib/learning-intelligence/adaptive";
import type { DifficultyLevel, QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";

/**
 * Picks `count` distinct question ids from pool using adaptive target level + fallbacks.
 * Mirrors demo `pickDistinctQuestionIds` without coupling to demo IDs.
 */
export function pickAdaptiveQuestionIds(params: {
  pool: QuestionPoolItem[];
  topicId: string;
  targetLevel: DifficultyLevel;
  count: number;
  excludeIds: string[];
  tieBreakSalt: string;
}): string[] {
  const picked: string[] = [];
  const recentWindow = [...params.excludeIds];

  for (let i = 0; i < params.count; i++) {
    const usedThisBatch = new Set([...params.excludeIds, ...picked]);
    const sel =
      selectNextQuestion({
        pool: params.pool,
        topicId: params.topicId,
        targetLevel: params.targetLevel,
        recentQuestionIds: recentWindow.slice(-12),
        excludedInSession: usedThisBatch,
        tieBreakSalt: `${params.tieBreakSalt}:i:${i}`,
      }) ?? null;

    let id: string | null = sel?.questionId ?? null;

    if (!id) {
      const sameTopic = params.pool.find((q) => !picked.includes(q.questionId) && q.topicId === params.topicId);
      id = sameTopic?.questionId ?? null;
    }
    if (!id) {
      const any = params.pool.find((q) => !picked.includes(q.questionId));
      id = any?.questionId ?? null;
    }
    if (!id) break;

    picked.push(id);
    recentWindow.push(id);
  }

  return picked;
}
