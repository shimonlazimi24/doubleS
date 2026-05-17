import type { BankQuestion } from "./types/bank-question";
import type { AdaptiveDecisionEvent } from "./persistence/types";

export function computeStreakState(params: {
  questionIds: string[];
  answersByQuestionId: Map<string, string | null>;
  bankById: Map<string, BankQuestion>;
  upToIndexExclusive: number;
}): { correct: number; wrong: number; recentAccuracy?: number } {
  const { questionIds, answersByQuestionId, bankById, upToIndexExclusive } = params;
  let attempted = 0;
  let correctTotal = 0;
  let correctStreak = 0;
  let wrongStreak = 0;

  for (let i = 0; i < upToIndexExclusive; i++) {
    const qid = questionIds[i];
    if (!qid) continue;
    const answer = answersByQuestionId.get(qid);
    if (answer == null) continue;
    const q = bankById.get(qid);
    if (!q) continue;
    const ok = q.correctOptionId === answer;
    attempted += 1;
    if (ok) correctTotal += 1;
  }

  for (let i = upToIndexExclusive - 1; i >= 0; i--) {
    const qid = questionIds[i];
    if (!qid) continue;
    const answer = answersByQuestionId.get(qid);
    if (answer == null) break;
    const q = bankById.get(qid);
    if (!q) break;
    const ok = q.correctOptionId === answer;
    if (ok && wrongStreak === 0) {
      correctStreak += 1;
      continue;
    }
    if (!ok && correctStreak === 0) {
      wrongStreak += 1;
      continue;
    }
    break;
  }

  return {
    correct: correctStreak,
    wrong: wrongStreak,
    recentAccuracy:
      attempted > 0 ? Number((correctTotal / attempted).toFixed(4)) : undefined,
  };
}

export function buildAdaptiveDecisionEvent(input: {
  topic: string;
  previousLevel: number;
  selectedLevel: number;
  reason: string;
  streak: { correct: number; wrong: number };
  recentAccuracy?: number;
  questionId?: string;
  sessionId?: string;
}): AdaptiveDecisionEvent {
  return {
    topic: input.topic,
    previousLevel: input.previousLevel,
    selectedLevel: input.selectedLevel,
    reason: input.sessionId
      ? `${input.reason};session=${input.sessionId}`
      : input.reason,
    streak: input.streak,
    recentAccuracy: input.recentAccuracy,
    questionId: input.questionId,
    timestamp: new Date().toISOString(),
  };
}
