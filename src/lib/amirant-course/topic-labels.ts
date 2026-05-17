import type { AmirantBankTopicSlug } from "./types/bank-question";

export const AMIRANT_TOPIC_LABEL_HE: Record<AmirantBankTopicSlug, string> = {
  vocabulary: "אוצר מילים",
  sentence_completion: "השלמת משפטים",
  rephrasing: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
};

const KNOWN = new Set<string>(["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"]);

export function normalizeQuizTopicSlugs(slugs: string[]): AmirantBankTopicSlug[] {
  const out = slugs.filter((s): s is AmirantBankTopicSlug => KNOWN.has(s));
  return out.length ? out : ["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"];
}
