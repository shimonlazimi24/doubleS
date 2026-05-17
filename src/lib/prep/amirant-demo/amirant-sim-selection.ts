import { selectNextQuestion } from "@/lib/learning-intelligence/adaptive";
import type { DifficultyLevel, QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";

/**
 * בוחר מזהי שאלות שונים מאותו בנק, עם ניסיון להיצמד ל־topic ורמת קושי;
 * משלים מ־pool כולו אם אין מספיק התאמות.
 */
export function pickDistinctQuestionIds(params: {
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
        recentQuestionIds: recentWindow.slice(-8),
        excludedInSession: usedThisBatch,
        tieBreakSalt: `${params.tieBreakSalt}:slot:${i}`,
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
