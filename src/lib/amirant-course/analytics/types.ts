export type TopicSlug = string;

export interface DifficultyBucketStats {
  correct: number;
  total: number;
}

export interface TopicRollup {
  correct: number;
  total: number;
  byDifficulty: Record<number, DifficultyBucketStats>;
  /** Sum of `timeMs` samples for mean time-per-question in UI. */
  responseTimeMsSum?: number;
  responseTimeSamples?: number;
}

export interface AmirantCourseAnalytics {
  version: 1;
  byTopic: Record<TopicSlug, TopicRollup>;
  sessions: { at: string; kind: "quiz" | "simulation" | "practice"; label: string; scorePct?: number }[];
}

export function emptyAnalytics(): AmirantCourseAnalytics {
  return { version: 1, byTopic: {}, sessions: [] };
}
