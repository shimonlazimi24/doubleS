import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import { LS_CROSS_TEST } from "../constants";
import { clampDifficultyLevel } from "../difficulty-clamp";

export type CrossTestSnapshot = {
  lastEndLevel: DifficultyLevel;
  lastScorePct: number;
  updatedAt: string;
};

export function readCrossTestSnapshot(): CrossTestSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_CROSS_TEST);
    if (!raw) return null;
    return JSON.parse(raw) as CrossTestSnapshot;
  } catch {
    return null;
  }
}

export function writeCrossTestSnapshot(s: CrossTestSnapshot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_CROSS_TEST, JSON.stringify(s));
}

/** Starting level for next adaptive test / simulation - soft reset after weak run. */
export function nextStartLevelFromCrossTest(): DifficultyLevel {
  const snap = readCrossTestSnapshot();
  if (!snap) return 3;
  if (snap.lastScorePct < 45) return clampDifficultyLevel(snap.lastEndLevel - 2);
  if (snap.lastScorePct < 60) return clampDifficultyLevel(snap.lastEndLevel - 1);
  if (snap.lastScorePct > 82) return clampDifficultyLevel(snap.lastEndLevel + 1);
  return clampDifficultyLevel(snap.lastEndLevel);
}
