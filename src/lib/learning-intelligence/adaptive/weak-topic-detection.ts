import { wilsonLowerBound } from "../analytics";
import type { LearnerSubtopicStatsRow, MasteryStatus, SubtopicMasteryView } from "./adaptive-state.types";

export const DEFAULT_SUBTOPIC_THRESHOLDS = {
  /** Minimum answers before weak/strong classification. */
  minAnswers: 5,
  weakWilsonMax: 0.55,
  strongWilsonMin: 0.78,
} as const;

/** Optional: flag slow wrong answers (deterministic heuristic). */
export function isSlowWrong(
  responseTimeSec: number,
  topicAverageResponseSec: number | null,
  isCorrect: boolean,
  multiplier = 1.5,
): boolean {
  if (isCorrect) return false;
  if (topicAverageResponseSec === null || topicAverageResponseSec <= 0) return false;
  return responseTimeSec > topicAverageResponseSec * multiplier;
}

export function classifyMastery(
  correct: number,
  total: number,
  t = DEFAULT_SUBTOPIC_THRESHOLDS,
): MasteryStatus {
  if (total < t.minAnswers) return "neutral";
  const w = wilsonLowerBound(correct, total);
  if (w < t.weakWilsonMax) return "weak";
  if (w >= t.strongWilsonMin) return "strong";
  return "neutral";
}

export function buildSubtopicMasteryView(row: LearnerSubtopicStatsRow): SubtopicMasteryView {
  const total = row.totalAnswered;
  const correct = row.correctAnswered;
  const wrong = row.wrongAnswered;
  const accuracy = total > 0 ? correct / total : 0;
  const averageResponseTimeSec = total > 0 ? row.sumResponseTimeSec / total : null;
  const wilsonLowerBoundVal = wilsonLowerBound(correct, total);
  const mastery = classifyMastery(correct, total);

  const explainParts = [
    `n=${total}`,
    `accuracy=${(accuracy * 100).toFixed(1)}%`,
    `Wilson LB=${wilsonLowerBoundVal.toFixed(3)}`,
    `mastery=${mastery}`,
  ];
  if (wrong > 0) explainParts.push(`wrong=${wrong}`);

  return {
    ...row,
    accuracy,
    averageResponseTimeSec,
    wilsonLowerBound: wilsonLowerBoundVal,
    mastery,
    explain: explainParts.join("; "),
  };
}

/** Sort weakest first (by Wilson LB ascending), then by fewer correct. */
export function rankWeakestSubtopics(rows: SubtopicMasteryView[]): SubtopicMasteryView[] {
  return [...rows].sort((a, b) => {
    if (a.wilsonLowerBound !== b.wilsonLowerBound) return a.wilsonLowerBound - b.wilsonLowerBound;
    return a.correctAnswered - b.correctAnswered;
  });
}
