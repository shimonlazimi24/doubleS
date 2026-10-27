/**
 * One adaptive attempt, step by step: start, answer one question, submit a
 * set or an essay, run out of time. Pure over the pool and the state; the
 * route adds auth, the token and persistence.
 */
import { gradeTypedWord } from "../../word-formation/grade-word";
import type { ClientSection, Level, SectionPlan, SectionResult } from "./types";
import {
  bandForScore,
  bonusForAccuracy,
  experimentalPlan,
  finalLevel,
  hashSeed,
  pickItem,
  rng,
  scoredPlan,
  scoreForLevel,
  stepAfterAnswer,
  stepAfterClip,
  stepAfterReadingSet,
  writingAccuracy,
  type PoolIndexItem,
} from "./engine";
import {
  clientPassageFor,
  clientQuestionsFor,
  clientWordFormationFor,
  clientWritingFor,
  getPoolItem,
  poolIndex,
  poolMcKey,
  poolRules,
  poolTypesAvailable,
  poolWordFormationKey,
  poolReportCopy,
} from "./pool.server";
import type { AttemptState } from "./state.server";
import type { AttemptReport, WritingOutcome } from "./types";

export type StepOutcome = {
  state: AttemptState;
  section: ClientSection | null;
  /** The just-answered question's correctness, for single mode (never the key). */
  lastCorrect?: boolean;
  report?: AttemptReport;
  /** The section just closed, when one did. */
  closedSection?: SectionResult;
};

const now = () => new Date().toISOString();

function random(state: AttemptState, salt: string): () => number {
  return rng(hashSeed(`${state.seed}:${salt}`));
}

function relatedOf(ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const rel = getPoolItem(id)?.related;
    if (rel) out.push(rel);
  }
  return out;
}

function secondsLeft(state: AttemptState): number {
  const plan = state.plan[state.sectionIndex];
  if (!plan) return 0;
  const elapsed = (Date.now() - Date.parse(state.sectionStartedAt)) / 1000;
  return Math.max(0, Math.round(plan.seconds - elapsed));
}

function pick(state: AttemptState, type: PoolIndexItem["type"], clipSeconds?: number) {
  const r = pickItem({
    index: poolIndex(),
    type,
    level: state.level,
    used: new Set(state.used),
    usedRelated: new Set(state.usedRelated),
    clipSeconds,
    preferUp: state.lastUp,
    random: random(state, `${state.sectionIndex}:${state.used.length}`),
  });
  if (!r) throw new Error(`the pool has no unused ${type} item`);
  if (r.substituted) state.substitutions += 1;
  state.used.push(r.item.id);
  state.usedRelated.push(...relatedOf([r.item.id]));
  return r;
}

/** Serves the current section's content: the next single question, the whole set, or the task. */
function serve(state: AttemptState): ClientSection {
  const plan = state.plan[state.sectionIndex]!;
  const base = { plan, questions: [], passages: [], wordFormation: [], writing: null, position: state.current.answered + 1, secondsLeft: secondsLeft(state) };
  if (plan.mode === "single") {
    const r = pick(state, plan.type);
    const item = getPoolItem(r.item.id)!;
    state.current.itemIds.push(item.id);
    state.current.levels.push(r.servedLevel);
    if (plan.type === "word_formation") {
      const wf = clientWordFormationFor(item);
      state.current.questionIds.push(wf.questionId);
      return { ...base, wordFormation: [wf] };
    }
    const [q] = clientQuestionsFor(item);
    state.current.questionIds.push(q!.questionId);
    return { ...base, questions: [q!] };
  }
  if (plan.mode === "set") {
    const questions: ClientSection["questions"] = [];
    const passages: ClientSection["passages"] = [];
    if (plan.type === "reading_set") {
      const r = pick(state, "reading_set");
      const item = getPoolItem(r.item.id)!;
      state.current.itemIds.push(item.id);
      state.current.levels.push(r.servedLevel);
      questions.push(...clientQuestionsFor(item));
      passages.push(clientPassageFor(item)!);
    } else {
      // Listening: three clips of 30, 60 and 90 seconds, each at the current level
      // within its length; the level moves per clip (resolved at submit).
      for (const secs of [30, 60, 90]) {
        const r = pick(state, "listening_lecture", secs);
        const item = getPoolItem(r.item.id)!;
        state.current.itemIds.push(item.id);
        state.current.levels.push(r.servedLevel);
        questions.push(...clientQuestionsFor(item));
        passages.push(clientPassageFor(item)!);
      }
    }
    state.current.questionIds.push(...questions.map((q) => q.questionId));
    return { ...base, questions, passages };
  }
  const r = pick(state, "writing_task");
  const item = getPoolItem(r.item.id)!;
  state.current.itemIds.push(item.id);
  state.current.levels.push(r.servedLevel);
  state.current.writingTaskId = item.taskId;
  return { ...base, writing: clientWritingFor(item) };
}

function openSection(state: AttemptState): ClientSection {
  state.current = { enterLevel: state.level, itemIds: [], questionIds: [], levels: [], answered: 0, correct: 0 };
  state.sectionStartedAt = now();
  return serve(state);
}

export function startAttempt(params: { userKey: string; simId: string; attemptId: string | null; priorUsed: string[]; startLevel?: number }): StepOutcome {
  const rules = poolRules();
  const seed = hashSeed(`${params.userKey}:${params.attemptId ?? Date.now()}:${Math.random()}`);
  const plan: SectionPlan[] = [...scoredPlan(rules), ...experimentalPlan(rules, poolTypesAvailable(), seed)];
  const state: AttemptState = {
    v: 1,
    attemptId: params.attemptId,
    userKey: params.userKey,
    seed,
    simId: params.simId,
    startedAt: now(),
    level: Math.max(1, Math.min(6, Math.round(params.startLevel ?? rules.startLevel))) as Level,
    lastUp: true,
    plan,
    sectionIndex: 0,
    sectionStartedAt: now(),
    used: [...params.priorUsed],
    usedRelated: relatedOf(params.priorUsed),
    current: { enterLevel: 4, itemIds: [], questionIds: [], levels: [], answered: 0, correct: 0 },
    scoredEvents: [],
    experimental: { correct: 0, total: 0 },
    results: [],
    writing: null,
    substitutions: 0,
    finished: false,
  };
  const section = openSection(state);
  return { state, section };
}

function closeSection(state: AttemptState, enterLevel: number): SectionResult {
  const plan = state.plan[state.sectionIndex]!;
  const result: SectionResult = {
    index: plan.index,
    kind: plan.kind,
    type: plan.type,
    labelHe: plan.labelHe,
    enterLevel,
    exitLevel: state.level,
    levelPath: [...state.current.levels],
    correct: state.current.correct,
    total: plan.questionCount,
    elapsedSec: Math.min(plan.seconds, Math.round((Date.now() - Date.parse(state.sectionStartedAt)) / 1000)),
  };
  state.results.push(result);
  if (plan.kind === "experimental") {
    state.experimental.correct += result.correct;
    state.experimental.total += result.total;
  }
  return result;
}

/** Moves to the next section, or marks the attempt finished. */
function advance(state: AttemptState, closed: SectionResult): StepOutcome {
  state.sectionIndex += 1;
  if (state.sectionIndex >= state.plan.length) {
    state.finished = true;
    return { state, section: null, closedSection: closed };
  }
  const section = openSection(state);
  return { state, section, closedSection: closed };
}

/** Single mode: grades one answer, steps the level, serves the next question or closes the section. */
export function answerSingle(state: AttemptState, questionId: string, answer: string): StepOutcome {
  const plan = state.plan[state.sectionIndex];
  if (!plan || plan.mode !== "single" || state.finished) throw new Error("not a single-question section");
  const expected = state.current.questionIds[state.current.answered];
  if (expected !== questionId) throw new Error("answer out of order");
  const enterLevel = state.current.enterLevel;
  let correct = false;
  if (plan.type === "word_formation") {
    const key = poolWordFormationKey(questionId);
    if (!key) throw new Error("unknown word-formation item");
    correct = gradeTypedWord(key, answer).isCorrect;
  } else {
    const key = poolMcKey(questionId);
    if (!key) throw new Error("unknown question");
    correct = key.correctOptionId === answer;
  }
  const servedLevel = state.current.levels[state.current.answered] ?? state.level;
  state.current.answered += 1;
  if (correct) state.current.correct += 1;
  if (plan.kind === "scored") state.scoredEvents.push({ level: servedLevel, correct });
  state.level = stepAfterAnswer(state.level, correct);
  state.lastUp = correct;
  if (state.current.answered >= plan.questionCount) {
    const closed = closeSection(state, enterLevel);
    return { ...advance(state, closed), lastCorrect: correct };
  }
  const section = serve(state);
  return { state, section, lastCorrect: correct };
}

/** Set mode: grades the whole reading passage or the three clips, steps the level per passage/clip. */
export function submitSet(state: AttemptState, answers: Record<string, string | null>): StepOutcome {
  const plan = state.plan[state.sectionIndex];
  if (!plan || plan.mode !== "set" || state.finished) throw new Error("not a set section");
  const enterLevel = state.current.enterLevel;
  // Group the served questions by item, in served order.
  const byItem = new Map<string, string[]>();
  for (const qid of state.current.questionIds) {
    const key = poolMcKey(qid);
    if (!key) continue;
    const list = byItem.get(key.itemId) ?? [];
    list.push(qid);
    byItem.set(key.itemId, list);
  }
  let i = 0;
  for (const itemId of state.current.itemIds) {
    const qids = byItem.get(itemId) ?? [];
    let correct = 0;
    for (const qid of qids) {
      const key = poolMcKey(qid)!;
      const ok = key.correctOptionId === (answers[qid] ?? null);
      if (ok) correct += 1;
      if (plan.kind === "scored") state.scoredEvents.push({ level: state.current.levels[i] ?? state.level, correct: ok });
    }
    state.current.answered += qids.length;
    state.current.correct += correct;
    const before = state.level;
    state.level = plan.type === "reading_set" ? stepAfterReadingSet(state.level, correct) : stepAfterClip(state.level, correct, qids.length);
    state.lastUp = state.level >= before;
    i += 1;
  }
  const closed = closeSection(state, enterLevel);
  return advance(state, closed);
}

/** Time ran out: whatever is unanswered counts wrong and the section closes. */
export function timeOut(state: AttemptState, answers: Record<string, string | null>): StepOutcome {
  const plan = state.plan[state.sectionIndex];
  if (!plan || state.finished) throw new Error("no open section");
  if (plan.mode === "set") return submitSet(state, answers);
  if (plan.mode === "writing") return submitWritingText(state, "");
  const enterLevel = state.current.enterLevel;
  // Unanswered single questions: each one wrong, each one a step down.
  while (state.current.answered < plan.questionCount) {
    const servedLevel = state.current.levels[state.current.answered] ?? state.level;
    if (plan.kind === "scored") state.scoredEvents.push({ level: servedLevel, correct: false });
    state.current.answered += 1;
    state.level = stepAfterAnswer(state.level, false);
    state.lastUp = false;
  }
  const closed = closeSection(state, enterLevel);
  return advance(state, closed);
}

/** Stores the essay; the grade is computed when the report is built. */
export function submitWritingText(state: AttemptState, text: string): StepOutcome {
  const plan = state.plan[state.sectionIndex];
  if (!plan || plan.mode !== "writing" || state.finished) throw new Error("not a writing section");
  const enterLevel = state.current.enterLevel;
  state.writing = { taskId: state.current.writingTaskId!, text };
  state.current.answered = 1;
  const closed = closeSection(state, enterLevel);
  return advance(state, closed);
}

export function buildReport(state: AttemptState, writing: WritingOutcome | null): AttemptReport {
  const rules = poolRules();
  const level = finalLevel(state.scoredEvents);
  const baseScore = scoreForLevel(level, rules.scoreAnchors);
  const expTotal = state.experimental.total;
  let accuracy: number | null = expTotal > 0 ? state.experimental.correct / expTotal : null;
  if (writing) accuracy = writingAccuracy(writing.content, writing.language);
  const bonus = bonusForAccuracy(accuracy, rules.experimentalBonus);
  const score = Math.min(150, baseScore + bonus);
  const scored = state.results.filter((r) => r.kind === "scored");
  const low = Math.max(50, score - 6);
  const high = Math.min(150, score + 6);
  const copy = poolReportCopy();
  // Section notes: one per type met, by that type's accuracy across its sections (part א §6 thresholds).
  const byType = new Map<string, { correct: number; total: number }>();
  for (const r of state.results) {
    const t = byType.get(r.type) ?? { correct: 0, total: 0 };
    t.correct += r.correct;
    t.total += r.total;
    byType.set(r.type, t);
  }
  if (writing) byType.set("writing_task", { correct: Math.round(writingAccuracy(writing.content, writing.language) * 10), total: 10 });
  const sectionNotes = (copy?.sectionNotes ?? []).flatMap((n) => {
    const t = byType.get(n.type);
    if (!t || t.total === 0) return [];
    const accuracy = t.correct / t.total;
    const th = copy!.sectionThresholds;
    const strength: "strong" | "mid" | "weak" = accuracy >= th.strong ? "strong" : accuracy >= th.mid ? "mid" : "weak";
    const noteHe = strength === "strong" ? n.strongHe : strength === "mid" ? n.midHe : n.weakHe;
    return [{ type: n.type, labelHe: n.labelHe, strength, accuracy: Math.round(accuracy * 100) / 100, noteHe, methodHe: n.methodHe }];
  });
  return {
    disclaimersHe: copy?.disclaimersHe ?? [],
    bandTable: (copy?.bands ?? []).map((b) => ({ min: b.min, max: b.max, labelHe: b.labelHe, meaningHe: b.meaningHe })),
    bandsCrossed: (copy?.bands ?? []).filter((b) => b.max >= low && b.min <= high),
    sectionNotes,
    attemptId: state.attemptId,
    simId: state.simId,
    startedAt: state.startedAt,
    finishedAt: now(),
    finalLevel: Math.round(level * 100) / 100,
    baseScore,
    bonus,
    score,
    low,
    high,
    bandHe: bandForScore(score, rules.bands),
    scoredCorrect: scored.reduce((s, r) => s + r.correct, 0),
    scoredTotal: scored.reduce((s, r) => s + r.total, 0),
    experimentalAccuracy: accuracy == null ? null : Math.round(accuracy * 100) / 100,
    sections: state.results,
    writing,
    substitutions: state.substitutions,
  };
}
