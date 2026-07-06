/**
 * Display-only cleanup for lesson bodies — no semantic changes to stored curriculum.
 */

/** Remove duplicate «מה לקחת מזה» blocks when the UI adds its own key-takeaway line. */
export function stripTakeawayBlocksFromBody(body: string | undefined): string | undefined {
  if (!body?.trim()) return body;
  let t = body.replace(/\r\n/g, "\n");
  t = t.replace(
    /(?:^|\n)\s*#{1,3}\s*מ\s*ה\s*ל[קק]חת\s+מזה[^\n]*/gi,
    "\n",
  );
  t = t.replace(
    /(?:^|\n)\s*\*?\*?מ\s*ה\s*ל[קק]חת\s+מזה:?\*?\*?\s+[^\n]+/gi,
    "\n",
  );
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * עוגני HTML גולמיים (<a name="פח6"></a>) שהגיעו ממסמכי המקור מרונדרים כטקסט מילולי
 * ב־ReactMarkdown — מסירים אותם תמיד לפני רינדור.
 */
export function stripHtmlAnchorNoise(body: string): string {
  return body
    .replace(/<a\s+name=[^>]*>\s*<\/a>/gi, "")
    .replace(/<a\s+name=[^>]*\/>/gi, "");
}

/** Strips common markdown separator noise (horizontal rules, pipes-only lines) from edges only. */
export function stripEdgeSeparatorNoise(body: string): string {
  const normalized = body.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  // Strip leading/trailing lines that are pure horizontal-rule / separator noise.
  // Never strip lines that could be part of a GFM table (those contain | with content).
  const isSeparatorLine = (l: string) => {
    const t = l.trim();
    if (!t) return false;
    // Pure HR: ---, ***, ___
    if (/^[-*_]{3,}$/.test(t)) return true;
    // Pure-pipes-only line: | --- | --- |  (no real content between pipes)
    // Only match if every cell is empty or dashes/spaces — not a real table separator between data rows
    if (/^\|[\s|:-]+\|$/.test(t) && !/\w/.test(t)) return true;
    return false;
  };

  let start = 0;
  let end = lines.length - 1;
  while (start <= end && isSeparatorLine(lines[start]!)) start++;
  while (end >= start && isSeparatorLine(lines[end]!)) end--;

  return lines
    .slice(start, end + 1)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
