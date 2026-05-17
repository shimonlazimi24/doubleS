import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";

/** Between scored simulation sections — stable, not per-question streak. */
export function nextSimulationSectionEnterLevel(prev: DifficultyLevel, correct: number, total: number): DifficultyLevel {
  if (total <= 0) return prev;
  const ratio = correct / total;
  if (ratio >= 0.75 && prev < 6) return (prev + 1) as DifficultyLevel;
  if (ratio <= 0.25 && prev > 1) return (prev - 1) as DifficultyLevel;
  return prev;
}
