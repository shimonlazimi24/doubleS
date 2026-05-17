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

/** Strips common markdown separator noise (pipes-only lines, horizontal rules) from trailing/leading. */
export function stripEdgeSeparatorNoise(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/^\s*[\|:\s-]{3,}\s*$(?:\n|$)/gim, "")
    .replace(/(?:^|\n)\s*\|[-\s|]+\|\s*$(?:\n)/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
