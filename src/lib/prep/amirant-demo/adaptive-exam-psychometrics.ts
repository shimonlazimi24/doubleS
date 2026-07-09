/**
 * מודל הערכת יכולת למבחן הסימולציה - **קירוב** לרוח CAT / מודל לוגיסטי (1PL),
 * לא העתקה של מודל סגור של מאל״ו (שאינו חשוף).
 *
 * - כל שאלה עם קושי b ∈ [1,6]; יכולת θ באותו סקאלה.
 * - P(נכון | θ, b) = σ(α·(θ − b)) - כמו פריט בודד ב־IRT פשוט.
 * - אחרי פרק: עדכון θ לפי ממוצע השאריות (y − P) - שקול למעבר צעד בניקוד Fisher / גראדיאנט רך.
 * - רמת הפרק הבא לבחירת שאלות: עיגול θ למספר שלם 1–6.
 *
 * בין מבחנים: שמירת θ ב־localStorage (יחד עם תאימות לערכים ישנים).
 */

import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";

const LS_THETA = "amirant-sim:lastTheta";
const LS_SCORED_PCT = "amirant-sim:lastScoredPct";
const LS_START_LEVEL = "amirant-sim:lastStartLevel";

const DEFAULT_THETA = 3;
/** רגישות מסלול קטן–גדול (דומה ל־a ב־2PL מוקטן). */
const DISCRIMINATION = 1.35;
/** קצב למידה לפרק - מאוזן מול רעש בפרקים קצרים. */
const DEFAULT_SECTION_ETA = 0.55;
const MAX_THETA_DELTA_PER_SECTION = 0.95;

function clampFloat(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function sigmoid(x: number): number {
  if (x > 40) return 1 - 1e-12;
  if (x < -40) return 1e-12;
  return 1 / (1 + Math.exp(-x));
}

/** הסתברות נכון לפי קירוב 1PL (יכולת θ, קושי פריט b). */
export function raschLikeP(theta: number, itemDifficulty: number): number {
  const b = clampFloat(itemDifficulty, 1, 6);
  const t = clampFloat(theta, 1, 6);
  return sigmoid(DISCRIMINATION * (t - b));
}

/**
 * עדכון θ אחרי פרק ציון: ממוצע השאריות (y−P) עם קצב למידה.
 * פרקים עם תערובת קושים - «קשה» יותר משקללת (דרך P) מאשר דיוק גולמי.
 */
export function updateThetaFromSectionResponses(
  theta: number,
  responses: ReadonlyArray<{ isCorrect: boolean; difficulty: number }>,
  opts?: { eta?: number; maxDelta?: number },
): number {
  if (responses.length === 0) return theta;
  const η = opts?.eta ?? DEFAULT_SECTION_ETA;
  const maxD = opts?.maxDelta ?? MAX_THETA_DELTA_PER_SECTION;
  const t0 = clampFloat(theta, 1, 6);
  let sumResidual = 0;
  for (const r of responses) {
    const b = clampFloat(r.difficulty, 1, 6);
    const p = raschLikeP(t0, b);
    sumResidual += (r.isCorrect ? 1 : 0) - p;
  }
  const meanResidual = sumResidual / responses.length;
  const delta = clampFloat(η * meanResidual, -maxD, maxD);
  return clampFloat(t0 + delta, 1, 6);
}

export function discreteLevelFromTheta(theta: number): DifficultyLevel {
  return clampFloat(Math.round(theta), 1, 6) as DifficultyLevel;
}

/** θ בין מבחן למבחן - עדיפות לערך השמור; אחרת תאימות לאחוז/רמה ישנים. */
export function readStoredThetaBetweenExams(): number {
  if (typeof window === "undefined") return DEFAULT_THETA;
  const raw = window.localStorage.getItem(LS_THETA);
  if (raw != null) {
    const v = parseFloat(raw);
    if (Number.isFinite(v)) return clampFloat(v, 1, 6);
  }
  return legacyThetaFromOldLocalStorage();
}

function legacyThetaFromOldLocalStorage(): number {
  const prevStart = parseInt(window.localStorage.getItem(LS_START_LEVEL) ?? "", 10);
  let start = Number.isFinite(prevStart) ? clampFloat(prevStart, 1, 6) : DEFAULT_THETA;
  const rawPct = window.localStorage.getItem(LS_SCORED_PCT);
  const pct = rawPct != null ? parseFloat(rawPct) : NaN;
  if (!Number.isFinite(pct)) return start;
  if (pct < 45) return clampFloat(start - 2 + pct / 200, 1, 6);
  if (pct < 60) return clampFloat(start - 1 + pct / 200, 1, 6);
  if (pct > 80) return clampFloat(start + 1 - (100 - pct) / 200, 1, 6);
  return start;
}

export function writeStoredExamOutcome(params: {
  theta: number;
  scoredPct: number;
  endDiscreteLevel: DifficultyLevel;
}): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_THETA, String(round4(params.theta)));
  window.localStorage.setItem(LS_SCORED_PCT, String(Math.round(params.scoredPct)));
  window.localStorage.setItem(LS_START_LEVEL, String(params.endDiscreteLevel));
}

function round4(x: number): number {
  return Math.round(x * 10000) / 10000;
}

/** להצגה / דיבוג - ממוצע P לפי θ ורשימת קשיים (לא נדרש ללוגיקה). */
export function expectedMeanP(theta: number, difficulties: number[]): number {
  if (difficulties.length === 0) return 0;
  let s = 0;
  for (const b of difficulties) s += raschLikeP(theta, b);
  return s / difficulties.length;
}
