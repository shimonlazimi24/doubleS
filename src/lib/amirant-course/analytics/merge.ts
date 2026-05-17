import type { AmirantCourseAnalytics, TopicRollup } from "./types";
import { emptyAnalytics } from "./types";

function ensureTopic(a: AmirantCourseAnalytics, topic: string): TopicRollup {
  if (!a.byTopic[topic]) {
    a.byTopic[topic] = { correct: 0, total: 0, byDifficulty: {} };
  }
  return a.byTopic[topic]!;
}

export function recordQuestionOutcome(
  prev: AmirantCourseAnalytics | null,
  params: {
    topicSlug: string;
    subtopicSlug?: string;
    difficulty: number;
    isCorrect: boolean;
    timeMs?: number;
  },
): AmirantCourseAnalytics {
  const a: AmirantCourseAnalytics = prev ? { ...prev, byTopic: { ...prev.byTopic }, sessions: [...prev.sessions] } : emptyAnalytics();
  const roll = ensureTopic(a, params.topicSlug);
  roll.total += 1;
  if (params.isCorrect) roll.correct += 1;
  const d = params.difficulty;
  if (!roll.byDifficulty[d]) roll.byDifficulty[d] = { correct: 0, total: 0 };
  roll.byDifficulty[d]!.total += 1;
  if (params.isCorrect) roll.byDifficulty[d]!.correct += 1;
  if (params.timeMs != null && params.timeMs > 0) {
    roll.responseTimeMsSum = (roll.responseTimeMsSum ?? 0) + params.timeMs;
    roll.responseTimeSamples = (roll.responseTimeSamples ?? 0) + 1;
  }
  return a;
}

export function recordSessionEnd(
  prev: AmirantCourseAnalytics | null,
  entry: { kind: "quiz" | "simulation" | "practice"; label: string; scorePct?: number },
): AmirantCourseAnalytics {
  const a: AmirantCourseAnalytics = prev ? { ...prev, sessions: [...prev.sessions] } : emptyAnalytics();
  a.sessions.push({
    at: new Date().toISOString(),
    kind: entry.kind,
    label: entry.label,
    scorePct: entry.scorePct,
  });
  if (a.sessions.length > 40) a.sessions = a.sessions.slice(-40);
  return a;
}

export function weakTopics(a: AmirantCourseAnalytics, minAttempts = 4): string[] {
  const out: { topic: string; acc: number; n: number }[] = [];
  for (const [topic, roll] of Object.entries(a.byTopic)) {
    if (roll.total < minAttempts) continue;
    out.push({ topic, acc: roll.correct / roll.total, n: roll.total });
  }
  return out.sort((x, y) => x.acc - y.acc).map((x) => x.topic);
}

export function strongTopics(a: AmirantCourseAnalytics, minAttempts = 4): string[] {
  const out: { topic: string; acc: number; n: number }[] = [];
  for (const [topic, roll] of Object.entries(a.byTopic)) {
    if (roll.total < minAttempts) continue;
    out.push({ topic, acc: roll.correct / roll.total, n: roll.total });
  }
  return out.sort((x, y) => y.acc - x.acc).map((x) => x.topic);
}
