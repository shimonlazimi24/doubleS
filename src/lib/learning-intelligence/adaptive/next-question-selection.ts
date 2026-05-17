import type { DifficultyLevel, NextQuestionSelection, QuestionPoolItem } from "./adaptive-state.types";

export const DEFAULT_SELECTION_CONFIG = {
  /** Prefer exact match to adaptive level first. */
  fallbackSteps: [0, 1, -1, 2, -2] as const,
  /** Block re-picking same id if seen within last K picks (caller passes ids). */
  recentQuestionWindow: 5,
} as const;

function candidatesAtLevel(pool: QuestionPoolItem[], topicId: string, level: DifficultyLevel): QuestionPoolItem[] {
  return pool.filter((q) => q.topicId === topicId && q.difficultyLevel === level);
}

function pickDeterministic(items: QuestionPoolItem[], salt: string): QuestionPoolItem {
  if (items.length === 1) return items[0];
  let h = 0;
  for (let i = 0; i < salt.length; i++) h = (h * 31 + salt.charCodeAt(i)) >>> 0;
  return items[h % items.length];
}

/**
 * Chooses next question for adaptive practice: same topic, target learner level, fallback levels,
 * excludes recent question IDs.
 */
export function selectNextQuestion(params: {
  pool: QuestionPoolItem[];
  topicId: string;
  targetLevel: DifficultyLevel;
  recentQuestionIds: QuestionPoolItem["questionId"][];
  /**
   * All question ids already used in the **current** attempt/batch (e.g. this quiz run).
   * Unrelated to the rolling `recent` window: prevents repeating a question once 12+ steps later.
   */
  excludedInSession?: ReadonlySet<QuestionPoolItem["questionId"]>;
  /** Tie-break salt — e.g. `${userId}:${topicId}:${day}` */
  tieBreakSalt: string;
}): NextQuestionSelection | null {
  const { pool, topicId, targetLevel, recentQuestionIds, tieBreakSalt, excludedInSession } = params;
  const blocked = new Set<string>([
    ...recentQuestionIds,
    ...(excludedInSession ? Array.from(excludedInSession) : []),
  ]);

  for (const step of DEFAULT_SELECTION_CONFIG.fallbackSteps) {
    const raw = targetLevel + step;
    if (raw < 1 || raw > 6) continue;
    const lvl = raw as DifficultyLevel;
    const at = candidatesAtLevel(pool, topicId, lvl).filter((q) => !blocked.has(q.questionId));
    if (at.length === 0) continue;
    const choice = pickDeterministic(at, `${tieBreakSalt}:${lvl}`);
    return {
      questionId: choice.questionId,
      usedDifficultyLevel: lvl,
      reason:
        step === 0
          ? "exact level match"
          : `fallback ${step > 0 ? "+" : ""}${step} from target ${targetLevel}`,
    };
  }

  const anyTopic = pool.filter((q) => q.topicId === topicId && !blocked.has(q.questionId));
  if (anyTopic.length === 0) return null;
  const choice = pickDeterministic(anyTopic, `${tieBreakSalt}:any`);
  return {
    questionId: choice.questionId,
    usedDifficultyLevel: choice.difficultyLevel,
    reason: "no match at preferred levels — any unused question in topic",
  };
}
