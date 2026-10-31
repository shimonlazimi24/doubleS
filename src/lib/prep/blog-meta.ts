/**
 * Derived facts about a guide that both the pages and the SEO test need:
 * word count, reading time and the topic it files under. No fs here, so the
 * test can import it without the server reader.
 */

export type BlogTopic = { id: string; titleHe: string; slugs: readonly string[] };

/** The guides hub groups posts by what the reader is asking; order is the page order. */
export const BLOG_TOPICS: readonly BlogTopic[] = [
  {
    id: "exam",
    titleHe: "על המבחן",
    slugs: ["what-is-amirant", "amirant-exam-structure-2026", "amirant-vs-amir", "amirant-reform-2026"],
  },
  {
    id: "score",
    titleHe: "ציון והכנה",
    slugs: ["amirant-passing-score", "how-long-to-prepare-for-amirant"],
  },
  {
    id: "pilot",
    titleHe: "פרקי הניסוי של 2026",
    slugs: ["amirant-listening-section", "amirant-writing-task", "amirant-grammar-in-context", "amirant-word-formation"],
  },
] as const;

/** Posts not listed in a topic (a new file) fall into this group so nothing is hidden. */
export const BLOG_TOPIC_OTHER: BlogTopic = { id: "other", titleHe: "עוד מדריכים", slugs: [] };

export function blogTopicOf(slug: string): BlogTopic {
  return BLOG_TOPICS.find((t) => t.slugs.includes(slug)) ?? BLOG_TOPIC_OTHER;
}

/** Tokens that carry a Hebrew or Latin letter; table pipes and digits alone do not count. */
export function blogWordCount(body: string): number {
  return body.split(/\s+/).filter((w) => /[א-תA-Za-z]/.test(w)).length;
}

/** Hebrew reading pace for an article with tables; floored at one minute. */
const WORDS_PER_MINUTE = 180;

export function blogReadingMinutes(body: string): number {
  return Math.max(1, Math.round(blogWordCount(body) / WORDS_PER_MINUTE));
}

/** `/prep/blog/<slug>` links inside the body (sibling guides, hub, pricing, sample page). */
export function blogInternalLinks(body: string): string[] {
  return Array.from(body.matchAll(/\]\((\/prep[^)\s]*)\)/g), (m) => m[1]!);
}
