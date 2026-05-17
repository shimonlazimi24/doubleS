import { markdownishToPlain } from "./split-markdown-lesson";

/**
 * One-line excerpt from existing lesson body only (display helper — no new facts).
 */
export function takeawayLineFromLessonBody(body: string | undefined): string | null {
  const plain = markdownishToPlain(body ?? "", 800).trim();
  if (!plain) return null;
  if (plain.length <= 200) return plain;
  const cut = plain.slice(0, 200);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (last > 50) return cut.slice(0, last + 1).trim();
  const sp = cut.lastIndexOf(" ");
  return sp > 40 ? `${cut.slice(0, sp).trim()}…` : `${cut.trim()}…`;
}

/** Rough plain length for layout decisions (strip most markdown noise). */
export function plainTextLengthApprox(body: string | undefined): number {
  return markdownishToPlain(body ?? "", 50_000).length;
}
