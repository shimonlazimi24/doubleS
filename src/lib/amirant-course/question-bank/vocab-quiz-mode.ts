/**
 * פרמטר URL (למשל `?vocab=verbs`) או בחירה ב־UI - לסינון שאלות אוצר מילים במבחן אדפטיבי.
 */
export type VocabQuizMode = "mixed" | "verbs" | "nouns" | "adjectives" | "adverbs" | "phrasal";

const ALLOWED: readonly VocabQuizMode[] = ["mixed", "verbs", "nouns", "adjectives", "adverbs", "phrasal"] as const;

export function isVocabQuizMode(s: string | undefined | null): s is VocabQuizMode {
  return s != null && (ALLOWED as readonly string[]).includes(s);
}

/**
 * @param raw ערך מ־`searchParams.vocab` (מחרוזת בודדת או מערך)
 */
export function parseVocabQuizParam(raw: string | string[] | undefined | null): VocabQuizMode {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v == null) return "mixed";
  const t = v.trim().toLowerCase();
  if (t === "" || t === "all") return "mixed";
  return isVocabQuizMode(t) ? t : "mixed";
}
