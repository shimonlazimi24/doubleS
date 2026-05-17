import { readCrossTestSnapshot } from "./adaptive/cross-test-storage";
import { loadAnalytics } from "./analytics/storage";
import { clampDifficultyLevel } from "./difficulty-clamp";
import type { GenerateWeakQuizRequest } from "./weak-quiz";

const ADAPTIVE_TOPICS: Array<GenerateWeakQuizRequest["adaptive_state"][number]["topic"]> = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
];

/**
 * Build generate-weak-quiz request payload from local analytics (browser).
 */
export function buildWeakQuizRequestFromLocalAnalytics(
  userId: string,
): GenerateWeakQuizRequest {
  const a = loadAnalytics();
  const stats = Object.entries(a.byTopic).map(([topic, roll]) => ({
    topic,
    questionsAttempted: roll.total,
    questionsCorrect: roll.correct,
    accuracy: roll.total > 0 ? roll.correct / roll.total : 0,
  }));
  const snap = readCrossTestSnapshot();
  const level = snap ? clampDifficultyLevel(snap.lastEndLevel) : 3;
  return {
    userId,
    learner_topic_stats: stats,
    adaptive_state: ADAPTIVE_TOPICS.map((topic) => ({
      topic,
      currentLevel: level,
    })),
  };
}
