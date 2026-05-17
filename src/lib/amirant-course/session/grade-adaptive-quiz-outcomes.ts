import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import type { BankQuestion } from "../types/bank-question";
import type { AmirantCourseAnalytics } from "../analytics/types";
import { initialInTestLevel, updateInTestLevelAfterAnswer } from "../adaptive/in-test-level";
import { recordQuestionOutcome, recordSessionEnd } from "../analytics/merge";
import { clampDifficultyLevel } from "../difficulty-clamp";

export type GradeAdaptiveQuizReason = "manual" | "timeout";

/**
 * Pure grading + analytics mutation for an adaptive MCQ session. UI should only pass inputs
 * and persist the returned analytics snapshot.
 */
export function gradeAdaptiveQuizOutcomes(params: {
  /** Result of `buildAdaptiveQuizQuestionIds` for the same `answers` snapshot. */
  questionIds: string[];
  answers: (string | null)[];
  bankById: Map<string, BankQuestion>;
  questionCount: number;
  startLevel: DifficultyLevel;
  currentIndex: number;
  reason: GradeAdaptiveQuizReason;
  nowMs: number;
  questionEnteredAtMs: number;
  prevAnalytics: AmirantCourseAnalytics;
  sessionLabel: string;
  /** אם הוגדר במניפסט — אותו רצף מעבר רמה כמו ב־`buildAdaptiveQuizQuestionIds`. */
  minInTestLevel?: DifficultyLevel;
}): {
  nextAnalytics: AmirantCourseAnalytics;
  correct: number;
  scorePercent: number;
  /** Last `currentLevel` after replaying graded answers in order (for cross-test snapshot). */
  finalAdaptiveLevel: DifficultyLevel;
} {
  const start = clampDifficultyLevel(params.startLevel);
  const min = params.minInTestLevel;
  const effectiveStart: DifficultyLevel = min != null ? (Math.max(start, min) as DifficultyLevel) : start;
  const inTestOpt = min != null ? { minInTestLevel: min } : undefined;
  let state = initialInTestLevel(effectiveStart);
  let correct = 0;
  let nextA = params.prevAnalytics;

  for (let i = 0; i < params.questionCount; i++) {
    const qid = params.questionIds[i];
    if (!qid) continue;
    const row = params.bankById.get(qid);
    if (!row) continue;
    const ans = params.answers[i];
    const timedBlank = ans == null && params.reason === "timeout" && i === params.currentIndex;
    if (ans == null && !timedBlank) continue;

    const isCorrect = ans != null && ans === row.correctOptionId;
    if (isCorrect) correct += 1;

    const timeMs = i === params.currentIndex ? Math.max(0, params.nowMs - params.questionEnteredAtMs) : undefined;
    nextA = recordQuestionOutcome(nextA, {
      topicSlug: row.topicSlug,
      subtopicSlug: row.subtopicSlug,
      difficulty: row.difficulty,
      isCorrect,
      timeMs,
    });
    state = updateInTestLevelAfterAnswer(state, isCorrect, inTestOpt).state;
  }

  const scorePercent =
    params.questionCount > 0 ? Math.round((correct / params.questionCount) * 100) : 0;
  const nextAnalytics = recordSessionEnd(nextA, {
    kind: "quiz",
    label: params.sessionLabel,
    scorePct: scorePercent,
  });

  return {
    nextAnalytics,
    correct,
    scorePercent,
    finalAdaptiveLevel: state.currentLevel,
  };
}
