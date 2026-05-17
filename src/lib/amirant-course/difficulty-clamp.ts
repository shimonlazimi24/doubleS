import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";

/** Canonical scale for Amirant bank + adaptive engine. */
export const AMIRANT_MIN_LEVEL = 1 as const;
export const AMIRANT_MAX_LEVEL = 6 as const;

/**
 * Ensures any external input (cross-test storage, API) cannot push the in-test engine
 * outside 1–6.
 */
export function clampDifficultyLevel(n: number): DifficultyLevel {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return 3;
  return Math.max(AMIRANT_MIN_LEVEL, Math.min(AMIRANT_MAX_LEVEL, x)) as DifficultyLevel;
}
