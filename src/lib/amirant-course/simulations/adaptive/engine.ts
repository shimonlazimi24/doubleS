/**
 * The adaptive simulation's pure logic: the section plan, level steps, item
 * selection without repeats, and the level-to-score mapping. The owner's rules
 * (pool document, part א) are the spec; every rule is cited where applied.
 *
 * No I/O: the server route feeds it the pool index and the learner's history
 * and persists what it returns. Deterministic for a given seed, so a test can
 * replay an attempt.
 */
import type { Level, PoolItemType, SectionMode, SectionPlan } from "./types";

export type PoolIndexItem = {
  id: string;
  type: PoolItemType;
  level: Level;
  b: number;
  /** Reading sets and listening clips: the passage id the questions share. */
  passageId?: string;
  clipSeconds?: number;
  related?: string | null;
};

export type SectionTime = { type: string; questions: number; minutes: number; core_sections?: number[] };

export type PoolRules = {
  startLevel: number;
  sectionTimes: SectionTime[];
  scoreAnchors: [number, number][];
  bands: [number, number, string][];
  experimentalBonus: [number, number][];
};

export const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

export const clampLevel = (n: number): Level => Math.max(1, Math.min(6, Math.round(n))) as Level;

/** Mulberry32: small, deterministic, good enough for shuffling a pool. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const LABEL_HE: Record<PoolItemType, string> = {
  sentence_completion: "השלמת משפטים",
  restatement: "ניסוח מחדש",
  reading_set: "הבנת הנקרא",
  listening_lecture: "האזנה: הרצאה או שיחה",
  word_formation: "יצירת מילה",
  writing_task: "מטלת כתיבה",
};

const MODE: Record<PoolItemType, SectionMode> = {
  sentence_completion: "single",
  restatement: "single",
  word_formation: "single",
  reading_set: "set",
  listening_lecture: "set",
  writing_task: "writing",
};

function timeFor(rules: PoolRules, type: string): SectionTime {
  const t = rules.sectionTimes.find((s) => s.type === type);
  if (!t) throw new Error(`section_times has no ${type}`);
  return t;
}

/**
 * The exam's six scored sections in the exam's order (part א §2):
 * SC, SC, RC, RS, RS, SC — read from `core_sections` so a wave can restate it.
 */
export function scoredPlan(rules: PoolRules): SectionPlan[] {
  const slots: { n: number; type: PoolItemType }[] = [];
  for (const s of rules.sectionTimes) {
    for (const n of s.core_sections ?? []) slots.push({ n, type: s.type as PoolItemType });
  }
  slots.sort((a, b) => a.n - b.n);
  return slots.map((slot, i) => {
    const t = timeFor(rules, slot.type);
    return {
      index: i,
      kind: "scored",
      type: slot.type,
      mode: MODE[slot.type],
      labelHe: `פרק ${slot.n} · ${LABEL_HE[slot.type]}`,
      questionCount: t.questions,
      seconds: t.minutes * 60,
    };
  });
}

/**
 * After the scored part: two experimental sections (listening and word
 * formation, in a random order) or one writing task, as the exam does
 * (part א §2). Deterministic per attempt seed; the pool decides what exists.
 */
export function experimentalPlan(rules: PoolRules, available: Set<PoolItemType>, seed: number): SectionPlan[] {
  const r = rng(seed ^ 0x9e3779b9);
  const two = (["listening_lecture", "word_formation"] as PoolItemType[]).filter((t) => available.has(t));
  const canWrite = available.has("writing_task");
  const useWriting = canWrite && (two.length === 0 || r() < 1 / 3);
  const types: PoolItemType[] = useWriting ? ["writing_task"] : r() < 0.5 ? two : [...two].reverse();
  return types.map((type, i) => {
    const t = timeFor(rules, type);
    return {
      index: 6 + i,
      kind: "experimental",
      type,
      mode: MODE[type],
      labelHe: `פרק ניסיוני · ${LABEL_HE[type]}`,
      questionCount: t.questions,
      seconds: t.minutes * 60,
    };
  });
}

/** Correct → one level up, wrong → one level down, bounded 1–6 (part א §3, "צעד אחרי כל תשובה"). */
export function stepAfterAnswer(level: Level, correct: boolean): Level {
  return clampLevel(level + (correct ? 1 : -1));
}

/** Reading set: 4–5 correct → up, 3 → same, 0–2 → down (part א §3, "הבנת הנקרא"). */
export function stepAfterReadingSet(level: Level, correct: number): Level {
  if (correct >= 4) return clampLevel(level + 1);
  if (correct <= 2) return clampLevel(level - 1);
  return level;
}

/** Listening clip: all correct → up, all wrong → down, else same (part א §3, "האזנה"). */
export function stepAfterClip(level: Level, correct: number, total: number): Level {
  if (total > 0 && correct === total) return clampLevel(level + 1);
  if (correct === 0) return clampLevel(level - 1);
  return level;
}

export type PickResult = { item: PoolIndexItem; servedLevel: Level; substituted: boolean };

/**
 * One unseen item of the type at the level; when the level is empty, the
 * nearest level in the direction of the last step, then the other direction
 * (part א §3, "בחירת שאלה בתוך רמה"). Related items of anything already used
 * in this attempt are skipped so one does not hint at the other ("נושאים
 * קרובים"). Random among candidates, by the attempt's generator.
 */
export function pickItem(params: {
  index: PoolIndexItem[];
  type: PoolItemType;
  level: Level;
  used: Set<string>;
  usedRelated: Set<string>;
  clipSeconds?: number;
  preferUp: boolean;
  random: () => number;
}): PickResult | null {
  const { index, type, level, used, usedRelated, clipSeconds, preferUp, random } = params;
  const fits = (it: PoolIndexItem) =>
    it.type === type &&
    !used.has(it.id) &&
    !usedRelated.has(it.id) &&
    (clipSeconds == null || it.clipSeconds === clipSeconds);
  const order: Level[] = [level];
  for (let d = 1; d <= 5; d++) {
    const a = (level + (preferUp ? d : -d)) as number;
    const b = (level + (preferUp ? -d : d)) as number;
    if (a >= 1 && a <= 6) order.push(a as Level);
    if (b >= 1 && b <= 6) order.push(b as Level);
  }
  for (const lvl of order) {
    const candidates = index.filter((it) => it.level === lvl && fits(it));
    if (candidates.length === 0) continue;
    const item = candidates[Math.floor(random() * candidates.length)]!;
    return { item, servedLevel: lvl, substituted: lvl !== level };
  }
  return null;
}

/**
 * The final ability after the scored sections (part א §4): the mean level of
 * the last six scored questions, each nudged by its answer (+0.5 when right,
 * −0.5 when wrong), on the 0.5–6.5 scale.
 */
export function finalLevel(scoredEvents: { level: number; correct: boolean }[]): number {
  const last = scoredEvents.slice(-6);
  if (last.length === 0) return 0.5;
  const sum = last.reduce((s, e) => s + e.level + (e.correct ? 0.5 : -0.5), 0);
  return Math.max(0.5, Math.min(6.5, sum / last.length));
}

/** Level → 50–150 through the anchor points, linear between them (part א §4). */
export function scoreForLevel(level: number, anchors: [number, number][]): number {
  const pts = [...anchors].sort((a, b) => a[0] - b[0]);
  if (level <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [l0, s0] = pts[i - 1]!;
    const [l1, s1] = pts[i]!;
    if (level <= l1) return Math.round(s0 + ((level - l0) / (l1 - l0)) * (s1 - s0));
  }
  return pts[pts.length - 1]![1];
}

export function bandForScore(score: number, bands: [number, number, string][]): string {
  const b = bands.find(([lo, hi]) => score >= lo && score <= hi);
  return b ? b[2] : bands[bands.length - 1]![2];
}

/** Experimental accuracy → bonus points: 80% → 2, 60% → 1 (part א §3, "פרקים ניסיוניים"). */
export function bonusForAccuracy(accuracy: number | null, table: [number, number][]): number {
  if (accuracy == null) return 0;
  const sorted = [...table].sort((a, b) => b[0] - a[0]);
  for (const [min, pts] of sorted) if (accuracy >= min) return pts;
  return 0;
}

/** A writing verdict as an accuracy, so the same bonus table applies. */
export function writingAccuracy(content: "low" | "mid" | "high", language: "low" | "mid" | "high"): number {
  const v = { low: 0.3, mid: 0.7, high: 1 } as const;
  return (v[content] + v[language]) / 2;
}
