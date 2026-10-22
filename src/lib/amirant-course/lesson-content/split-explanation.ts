/**
 * Splits a question explanation into what opens by default and what the learner
 * expands on request. The owner's explanations follow one shape:
 *
 *   **הסבר קצר:** …  _English line_
 *   **הסבר מלא:** …   💡 שיטה: …  _English line_
 *   **למה לא האפשרויות האחרות**  ✗ option — reason …
 *   **✓ תשובה סופית:** …  **מילים לשינון:** …
 *
 * The older bank uses "**Why (A) is correct:**" / "**Why the other options are
 * wrong:**". Anything without a recognised marker stays as one short block.
 */
export type ExplanationParts = {
  /** Always visible. */
  short: string;
  /** "הסבר מלא" + method; collapsed. */
  full: string | null;
  /** Why the distractors fail, plus the final answer and words to memorise; collapsed. */
  whyNot: string | null;
};

const FULL_MARK = /\*\*הסבר מלא:?\*\*/;
const WHY_NOT_MARKS = [/\*\*למה לא האפשרויות האחרות\*\*:?/, /\*\*טעויות נפוצות\*\*:?/, /\*\*Why the other options are wrong:?\*\*/i];

function indexOf(text: string, re: RegExp): number {
  const m = re.exec(text);
  return m ? m.index : -1;
}

function clean(s: string | null): string | null {
  const t = (s ?? "").trim();
  return t ? t : null;
}

export function splitExplanation(markdown: string): ExplanationParts {
  const text = markdown.trim();
  const fullAt = indexOf(text, FULL_MARK);
  const whyAt = WHY_NOT_MARKS.map((re) => indexOf(text, re)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1;

  if (fullAt < 0 && whyAt < 0) return { short: text, full: null, whyNot: null };

  const shortEnd = fullAt >= 0 ? fullAt : whyAt;
  const short = text.slice(0, shortEnd);
  const full = fullAt >= 0 ? text.slice(fullAt, whyAt > fullAt ? whyAt : undefined) : null;
  const whyNot = whyAt >= 0 ? text.slice(whyAt) : null;
  return { short: clean(short) ?? text, full: clean(full), whyNot: clean(whyNot) };
}
