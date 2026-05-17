import { selectNextQuestion, type DifficultyLevel, type QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import { initialInTestLevel, updateInTestLevelAfterAnswer } from "../adaptive/in-test-level";
import type { BankQuestion } from "../types/bank-question";
import { clampDifficultyLevel } from "../difficulty-clamp";

const RECENT_IDS_WINDOW = 12;

/**
 * Builds the adaptive question sequence for a quiz: each step picks at the **current** streak level,
 * then applies `updateInTestLevelAfterAnswer` when `answers[i]` is non-null.
 * Truncate forward answers before calling to invalidate picks after an edit.
 *
 * Invariants: `startLevel` is clamped to 1–6; selected ids are never reused in `used` (while enough
 * distinct items exist in `pool`); `selectNextQuestion` already falls back to adjacent difficulty
 * levels when the exact level is empty.
 */
export function buildAdaptiveQuizQuestionIds(params: {
  pool: QuestionPoolItem[];
  bankById: Map<string, BankQuestion>;
  topicSlugs: string[];
  questionCount: number;
  startLevel: DifficultyLevel;
  answers: (string | null)[];
  tieBreakSalt: string;
  /** לא מורידים את רמת המסלול במבחן מתחת לערך (למשל רמה 3+). */
  minInTestLevel?: DifficultyLevel;
}): string[] {
  const topics = params.topicSlugs.length
    ? params.topicSlugs
    : (["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"] as const);
  const start = clampDifficultyLevel(params.startLevel);
  const minL = params.minInTestLevel;
  const effectiveStart: DifficultyLevel =
    minL != null ? (Math.max(start, minL) as DifficultyLevel) : start;
  let state = initialInTestLevel(effectiveStart);
  const inTestOpt = minL != null ? { minInTestLevel: minL as DifficultyLevel } : undefined;
  const ids: string[] = [];
  const used: string[] = [];
  const usedSet = new Set<string>();

  for (let i = 0; i < params.questionCount; i++) {
    const topicId = topics[i % topics.length]!;
    // `excludedInSession` = all ids already placed in this quiz; `recent` alone allowed repeats
    // after 12+ steps when a question fell out of the window (user saw the same stem again).
    const sel =
      selectNextQuestion({
        pool: params.pool,
        topicId,
        targetLevel: state.currentLevel,
        recentQuestionIds: used.slice(-RECENT_IDS_WINDOW),
        excludedInSession: usedSet,
        tieBreakSalt: `${params.tieBreakSalt}:i:${i}`,
      }) ?? null;

    let id = sel?.questionId ?? null;
    if (!id) {
      const inTopic = params.pool.find((q) => q.topicId === topicId && !usedSet.has(q.questionId));
      id = inTopic?.questionId ?? null;
    }
    if (!id) {
      const anyPool = params.pool.find((q) => !usedSet.has(q.questionId));
      id = anyPool?.questionId ?? null;
    }
    if (!id) break;

    ids.push(id);
    used.push(id);
    usedSet.add(id);

    const ans = params.answers[i];
    if (ans == null) break;

    const row = params.bankById.get(id);
    const isCorrect = row ? row.correctOptionId === ans : false;
    state = updateInTestLevelAfterAnswer(state, isCorrect, inTestOpt).state;
  }

  return ids;
}
