/**
 * Display-only cleanup of source-document ornaments: pictographic emoji in
 * headings and lead-ins ("💡 חשוב:"), ✅/❌ verdict marks at the end of list
 * items, and ✓/✗ bullets. The stored curriculum is not changed.
 */

// Surrogate-pair emoji, plus the BMP symbol ranges the authors use (☀-➿, ⬀-⯿,
// arrows), the variation selector and the zero-width joiner that glue them.
const PICTOGRAPHIC = /[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿⬀-⯿️‍]/g;
const PICTOGRAPHIC_RUN = /(?:[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿⬀-⯿️‍])+[ \t]*/g;

/** Plain-text variant for titles and labels that never go through markdown. */
export function stripPictographs(text: string): string {
  return text.replace(PICTOGRAPHIC, "").replace(/\s{2,}/g, " ").trim();
}

const VERDICT_YES = /\s*✅\s*$/;
const VERDICT_NO = /\s*❌\s*$/;

/** A line that is only a verdict mark ("✅", "❌") carries nothing once stripped. */
function isBareMark(line: string): boolean {
  return /^\s*(?:[-*+]\s*)?[✅❌✓✗✔✘]\s*$/.test(line);
}

/**
 * Trailing ✅/❌ on a comparison row ("analysis = שם עצם ❌") become words, so the
 * verdict survives without the glyph; every other ornament is dropped.
 */
export function stripOrnaments(markdown: string): string {
  if (!markdown) return markdown;
  const parts = markdown.replace(/\r\n/g, "\n").split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .split("\n")
        .filter((line) => !isBareMark(line))
        .map((line) => {
          let l = line;
          if (VERDICT_YES.test(l)) l = l.replace(VERDICT_YES, " (מתאים)");
          else if (VERDICT_NO.test(l)) l = l.replace(VERDICT_NO, " (לא מתאים)");
          // "✗ option — reason" / "✓ final answer": the mark adds nothing to the words.
          l = l.replace(/^(\s*(?:[-*+]\s+)?(?:\*\*)?)[✓✗✔✘]\s*/, "$1");
          // The space that followed the emoji goes with it, so "**💡 חשוב:**"
          // becomes "**חשוב:**" and the bold still parses.
          l = l.replace(PICTOGRAPHIC_RUN, "");
          return l.replace(/\*\*\*\*/g, "").replace(/[ \t]+$/g, "");
        })
        .join("\n");
    })
    .join("");
}

const OPTION_RUN = /\((A|B|C|D|E)\)\s*/;

/**
 * Example questions written as one line, "stem (A) x (B) y (C) z (D) w",
 * become the stem followed by one option per line, so the learner reads them
 * the way the exam shows them. Works inside blockquotes too.
 */
export function listInlineOptions(markdown: string): string {
  if (!markdown.includes("(A)")) return markdown;
  return markdown
    .split("\n")
    .map((line) => {
      const quote = line.match(/^(\s*>\s?)/)?.[1] ?? "";
      const text = line.slice(quote.length);
      const marks: RegExpExecArray[] = [];
      const re = new RegExp(OPTION_RUN.source, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) marks.push(m);
      if (marks.length < 3) return line;
      // Only a run that starts with (A) and continues in order is an option list.
      const letters = marks.map((m) => m[1]);
      if (letters[0] !== "A" || letters.some((l, i) => l !== "ABCDE"[i])) return line;
      const stem = text.slice(0, marks[0]!.index).trim();
      const options = marks.map((m, i) => {
        const start = m.index! + m[0].length;
        const end = i + 1 < marks.length ? marks[i + 1]!.index! : text.length;
        return `${quote}- (${m[1]}) ${text.slice(start, end).trim()}`;
      });
      return [...(stem ? [`${quote}${stem}`, quote.trimEnd()] : []), ...options].join("\n");
    })
    .join("\n");
}
