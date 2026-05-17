import { wilsonLowerBound } from "../analytics";
import type { DifficultyLevel, LearnerAdaptiveTopicState } from "./adaptive-state.types";

/** Streak-based level changes — MVP default. */
export const DEFAULT_STREAK_RULES = {
  correctInARowToMoveUp: 2,
  wrongInARowToMoveDown: 2,
  minLevel: 1 as DifficultyLevel,
  maxLevel: 6 as DifficultyLevel,
  /** Cap for `recentOutcomes` ring buffer. */
  recentOutcomesMax: 10,
} as const;

/** Optional rolling window rule (alternative or tie-breaker in advanced mode). */
export function recentWindowAccuracy(outcomes: boolean[]): number {
  if (outcomes.length === 0) return 0;
  const c = outcomes.filter(Boolean).length;
  return c / outcomes.length;
}

export interface LevelTransitionResult {
  nextLevel: DifficultyLevel;
  correctStreak: number;
  wrongStreak: number;
  reason: string;
}

/**
 * Pure transition: updates streaks and optionally level after one graded answer.
 * Does not persist — caller writes DB.
 */
export function applyStreakLevelTransition(
  state: Pick<LearnerAdaptiveTopicState, "currentLevel" | "correctStreak" | "wrongStreak">,
  isCorrect: boolean,
  rules = DEFAULT_STREAK_RULES,
): LevelTransitionResult {
  let level = state.currentLevel;
  let cs = state.correctStreak;
  let ws = state.wrongStreak;
  let reason = "no level change";

  if (isCorrect) {
    cs += 1;
    ws = 0;
    if (cs >= rules.correctInARowToMoveUp && level < rules.maxLevel) {
      level = (level + 1) as DifficultyLevel;
      cs = 0;
      reason = `moved up after ${rules.correctInARowToMoveUp} correct in a row`;
    }
  } else {
    ws += 1;
    cs = 0;
    if (ws >= rules.wrongInARowToMoveDown && level > rules.minLevel) {
      level = (level - 1) as DifficultyLevel;
      ws = 0;
      reason = `moved down after ${rules.wrongInARowToMoveDown} wrong in a row`;
    }
  }

  return { nextLevel: level, correctStreak: cs, wrongStreak: ws, reason };
}

/** Append one outcome and cap length (oldest dropped). */
export function pushRecentOutcome(
  recent: boolean[],
  isCorrect: boolean,
  max = DEFAULT_STREAK_RULES.recentOutcomesMax,
): boolean[] {
  const next = [...recent, isCorrect];
  if (next.length <= max) return next;
  return next.slice(next.length - max);
}

/** Derive confidence (Wilson LB) and recent accuracy from state snapshot. */
export function deriveAdaptiveSignals(state: Pick<LearnerAdaptiveTopicState, "correctAnswered" | "totalAnswered" | "recentOutcomes">): {
  confidence: number;
  recentAccuracy: number;
} {
  const confidence = wilsonLowerBound(state.correctAnswered, state.totalAnswered);
  const recentAccuracy = recentWindowAccuracy(state.recentOutcomes);
  return { confidence, recentAccuracy };
}
