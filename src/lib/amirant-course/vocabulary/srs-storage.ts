/**
 * חזרה מרווחת מקומית לכרטיסי אוצר מילים (SM-2 מצומצם).
 * מפתח לפי lessonId + wordId כדי שחבילות לא יתערבבו.
 */

export type VocabSrsRating = "again" | "hard" | "good";

export type VocabSrsCard = {
  reps: number;
  intervalDays: number;
  dueAt: string;
};

export type VocabSrsDeck = Record<string, VocabSrsCard>;

const LS_KEY = "amirant-vocab-srs:v1";

function todayIsoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function addDays(from: Date, days: number): Date {
  const n = new Date(from);
  n.setDate(n.getDate() + days);
  return n;
}

export function loadVocabSrsDeck(lessonId: string): VocabSrsDeck {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, VocabSrsDeck>;
    return all[lessonId] ?? {};
  } catch {
    return {};
  }
}

export function saveVocabSrsDeck(lessonId: string, deck: VocabSrsDeck): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, VocabSrsDeck>) : {};
    all[lessonId] = deck;
    window.localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* best effort */
  }
}

export function rateVocabCard(prev: VocabSrsCard | undefined, rating: VocabSrsRating, now = new Date()): VocabSrsCard {
  const reps = (prev?.reps ?? 0) + 1;
  let intervalDays: number;
  if (rating === "again") {
    intervalDays = 0;
  } else if (rating === "hard") {
    intervalDays = Math.max(1, Math.round((prev?.intervalDays ?? 1) * 1.2));
  } else if (!prev || prev.reps === 0) {
    intervalDays = 1;
  } else if (prev.reps === 1) {
    intervalDays = 3;
  } else {
    intervalDays = Math.min(60, Math.round(prev.intervalDays * 2.2));
  }
  return {
    reps: rating === "again" ? Math.max(0, (prev?.reps ?? 1) - 1) : reps,
    intervalDays,
    dueAt: addDays(now, intervalDays).toISOString(),
  };
}

export function isVocabCardDue(card: VocabSrsCard | undefined, now = new Date()): boolean {
  if (!card) return true;
  return card.dueAt.slice(0, 10) <= todayIsoDate(now);
}

export function countDueVocabCards(deck: VocabSrsDeck, wordIds: string[], now = new Date()): number {
  return wordIds.filter((id) => isVocabCardDue(deck[id], now)).length;
}
