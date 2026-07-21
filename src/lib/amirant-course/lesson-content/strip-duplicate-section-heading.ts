/**
 * If the first line of `body` is a markdown heading that repeats `sectionTitle`,
 * remove it so the page can show a single H2 without duplicating the title in prose.
 * Display-only; does not alter source files.
 */
function normalizeForCompare(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    // אימוג'י בכותרת המקור לא קיים בתווית הצעד - לא רלוונטי להשוואה
    .replace(/[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿️‍]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headingsMatch(headingLine: string, sectionTitle: string): boolean {
  const stripEnd = (x: string) => x.replace(/[?!.,;:\s]+$/, "").trim();
  const a = stripEnd(normalizeForCompare(headingLine));
  const b = stripEnd(normalizeForCompare(sectionTitle));
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  if (a.length >= 8 && b.length >= 8 && (a.includes(b) || b.includes(a))) {
    return true;
  }
  return false;
}

export function stripLeadingDuplicateSectionHeading(body: string | undefined, sectionTitle: string): string | undefined {
  if (!body?.trim() || !sectionTitle.trim()) {
    return body;
  }
  const lines = body.split("\n");
  if (lines.length === 0) {
    return body;
  }
  const first = lines[0]!.trim();
  const m = first.match(/^(#{1,6})\s+(.+)$/);
  if (m) {
    if (headingsMatch(m[2]!, sectionTitle)) {
      return lines.slice(1).join("\n").trim();
    }
  }
  return body;
}
