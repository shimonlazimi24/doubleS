import {
  applyStreakLevelTransition,
  DEFAULT_STREAK_RULES,
  type DifficultyLevel,
} from "@/lib/learning-intelligence/adaptive";
import { clampDifficultyLevel } from "../difficulty-clamp";

/**
 * In-test adaptive level: **stable** step changes - two correct in a row to move up,
 * two wrong in a row to move down (uses shared `applyStreakLevelTransition`).
 * Levels are always within 1–6 (`applyStreakLevelTransition` + clamp on init).
 */
export type InTestLevelState = {
  currentLevel: DifficultyLevel;
  correctStreak: number;
  wrongStreak: number;
};

export function initialInTestLevel(start: DifficultyLevel): InTestLevelState {
  return { currentLevel: clampDifficultyLevel(start), correctStreak: 0, wrongStreak: 0 };
}

export function updateInTestLevelAfterAnswer(
  state: InTestLevelState,
  isCorrect: boolean,
  options?: { minInTestLevel?: DifficultyLevel },
): { state: InTestLevelState; transitionReason: string } {
  const min = options?.minInTestLevel;
  const rules =
    min != null
      ? { ...DEFAULT_STREAK_RULES, minLevel: min, maxLevel: 6 as const }
      : DEFAULT_STREAK_RULES;
  const t = applyStreakLevelTransition(state, isCorrect, rules);
  return {
    state: {
      currentLevel: t.nextLevel,
      correctStreak: t.correctStreak,
      wrongStreak: t.wrongStreak,
    },
    transitionReason: t.reason,
  };
}
