/**
 * מבחן רמה - טופס קבוע (לא אדפטיבי): 8 השלמת משפטים → 4 ניסוח מחדש →
 * 3 הבנת הנקרא על קטע אחד. תמהיל קושי מאוזן, בחירה דטרמיניסטית לפי seed
 * (משתנה בין ניסיונות), עם החרגת שאלות/קטעים שנראו לאחרונה.
 */

/** Minimal shape — works with public bank (no answer keys) or full bank. */
export type PlacementBankQuestion = {
  id: string;
  topicSlug: string;
  difficulty: number;
  passageId?: string;
};

export type PlacementQuizForm = {
  /** 15 מזהי שאלות בסדר הצגה קבוע. */
  questionIds: string[];
  /** הקטע המשותף לשאלות 13–15. */
  passageId: string | null;
};

/** תמהיל קושי לכל חלק: [קל 1–2, בינוני 3–4, קשה 5–6] */
const SENTENCE_COMPLETION_MIX = [
  { min: 1, max: 2, count: 3 },
  { min: 3, max: 4, count: 3 },
  { min: 5, max: 6, count: 2 },
] as const;
const REPHRASING_MIX = [
  { min: 1, max: 2, count: 1 },
  { min: 3, max: 4, count: 2 },
  { min: 5, max: 6, count: 1 },
] as const;
const READING_COUNT = 3;

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** בוחר count שאלות בטווח קושי; אם אין מספיק אחרי החרגות - מרפה את ההחרגה ואז את הטווח. */
function pickByDifficulty(params: {
  pool: PlacementBankQuestion[];
  min: number;
  max: number;
  count: number;
  exclude: Set<string>;
  taken: Set<string>;
  rng: () => number;
}): PlacementBankQuestion[] {
  const { pool, min, max, count, exclude, taken, rng } = params;
  const inRange = pool.filter((q) => q.difficulty >= min && q.difficulty <= max && !taken.has(q.id));
  const fresh = inRange.filter((q) => !exclude.has(q.id));
  const source = fresh.length >= count ? fresh : inRange;
  const picked = shuffled(source, rng).slice(0, count);
  if (picked.length < count) {
    // הרפיית טווח קושי - כל השאלות בנושא שטרם נלקחו
    const rest = shuffled(
      pool.filter((q) => !taken.has(q.id) && !picked.some((p) => p.id === q.id)),
      rng,
    ).slice(0, count - picked.length);
    picked.push(...rest);
  }
  for (const q of picked) taken.add(q.id);
  return picked;
}

function questionOrdinal(id: string): number {
  const m = id.match(/-q(\d+)$/);
  return m ? Number(m[1]) : 0;
}

export function buildPlacementQuizForm(params: {
  bank: PlacementBankQuestion[];
  seed: string;
  excludeQuestionIds?: Set<string>;
  excludePassageIds?: Set<string>;
}): PlacementQuizForm {
  const { bank, seed } = params;
  const exclude = params.excludeQuestionIds ?? new Set<string>();
  const excludePassages = params.excludePassageIds ?? new Set<string>();
  const rng = mulberry32(hashSeed(seed));
  const taken = new Set<string>();

  const sc = bank.filter((q) => q.topicSlug === "sentence_completion");
  const rs = bank.filter((q) => q.topicSlug === "rephrasing");

  const scPicked: PlacementBankQuestion[] = [];
  for (const bandMix of SENTENCE_COMPLETION_MIX) {
    scPicked.push(
      ...pickByDifficulty({ pool: sc, min: bandMix.min, max: bandMix.max, count: bandMix.count, exclude, taken, rng }),
    );
  }
  const rsPicked: PlacementBankQuestion[] = [];
  for (const bandMix of REPHRASING_MIX) {
    rsPicked.push(
      ...pickByDifficulty({ pool: rs, min: bandMix.min, max: bandMix.max, count: bandMix.count, exclude, taken, rng }),
    );
  }

  // הבנת הנקרא: קטע אחד עם לפחות 3 שאלות
  const rcByPassage = new Map<string, PlacementBankQuestion[]>();
  for (const q of bank) {
    if (q.topicSlug !== "reading_comprehension" || !q.passageId) continue;
    const list = rcByPassage.get(q.passageId) ?? [];
    list.push(q);
    rcByPassage.set(q.passageId, list);
  }
  const eligible = Array.from(rcByPassage.entries()).filter(([, qs]) => qs.length >= READING_COUNT);
  const freshPassages = eligible.filter(([pid]) => !excludePassages.has(pid));
  const passagePool = freshPassages.length > 0 ? freshPassages : eligible;
  const passageEntry = passagePool.length > 0 ? shuffled(passagePool, rng)[0]! : null;

  let rcPicked: PlacementBankQuestion[] = [];
  let passageId: string | null = null;
  if (passageEntry) {
    passageId = passageEntry[0];
    rcPicked = shuffled(passageEntry[1], rng)
      .slice(0, READING_COUNT)
      .sort((a, b) => questionOrdinal(a.id) - questionOrdinal(b.id));
  } else {
    // fallback: שאלות RC בלי קטע (לא אמור לקרות עם passages.json מלא)
    rcPicked = shuffled(
      bank.filter((q) => q.topicSlug === "reading_comprehension" && !taken.has(q.id)),
      rng,
    ).slice(0, READING_COUNT);
  }

  return {
    questionIds: [...scPicked, ...rsPicked, ...rcPicked].map((q) => q.id),
    passageId,
  };
}

/**
 * Placement estimate on the official 50-150 scale.
 *
 * Replaces a plain `50 + percentage`, which ignored item difficulty (while the
 * course itself teaches that harder items carry more weight) and scored blind
 * guessing at ~75 — a number a learner reads as a real result.
 *
 * The model is deliberately simple and stated as such to the learner:
 *   1. weight each item by its difficulty (1-6), so a hard item earns more;
 *   2. correct for guessing on four options, so chance performance lands at the
 *      bottom of the scale rather than a third of the way up;
 *   3. report a **range**, because 15 items cannot support a point estimate.
 *
 * This is not an IRT calibration and must not be presented as an official score.
 */

export type PlacementScoredItem = { difficulty: number; isCorrect: boolean };

export type PlacementScoreEstimate = {
  /** Mid-point of the range — for storage and trend comparison, not for display alone. */
  score: number;
  low: number;
  high: number;
};

/** Four options per item, so a blind guess is right a quarter of the time. */
const CHANCE_RATE = 0.25;
const SCALE_MIN = 50;
/** A 15-item placement form cannot evidence a top-of-scale result. */
const SCALE_MAX_FOR_PLACEMENT = 145;
const MIN_MARGIN = 6;
const MAX_MARGIN = 18;

function clampToScale(value: number): number {
  return Math.min(150, Math.max(SCALE_MIN, Math.round(value)));
}

export function estimatePlacementScore(items: PlacementScoredItem[]): PlacementScoreEstimate {
  const n = items.length;
  if (n === 0) return { score: SCALE_MIN, low: SCALE_MIN, high: SCALE_MIN };

  const weight = (difficulty: number) => Math.min(6, Math.max(1, difficulty));
  const maxWeight = items.reduce((sum, item) => sum + weight(item.difficulty), 0);
  const earned = items.reduce(
    (sum, item) => sum + (item.isCorrect ? weight(item.difficulty) : 0),
    0,
  );
  const rawRate = maxWeight > 0 ? earned / maxWeight : 0;

  // Guessing correction: map [chance, 1] onto [0, 1].
  const corrected = Math.min(1, Math.max(0, (rawRate - CHANCE_RATE) / (1 - CHANCE_RATE)));
  const span = SCALE_MAX_FOR_PLACEMENT - SCALE_MIN;
  const point = SCALE_MIN + corrected * span;

  // Binomial standard error on the observed proportion, widened by the same
  // guessing correction, expressed in scale points.
  const observedRate = items.filter((item) => item.isCorrect).length / n;
  const standardError = Math.sqrt(Math.max(observedRate * (1 - observedRate), 0.04) / n);
  const margin = Math.min(
    MAX_MARGIN,
    Math.max(MIN_MARGIN, Math.round((standardError / (1 - CHANCE_RATE)) * span)),
  );

  return {
    score: clampToScale(point),
    low: clampToScale(point - margin),
    high: clampToScale(point + margin),
  };
}
