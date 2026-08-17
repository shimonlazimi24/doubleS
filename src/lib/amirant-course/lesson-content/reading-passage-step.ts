/**
 * מזהה צעדי «קטע קריאה» בשיעור markdown כדי להציג הקטע לצד השאלות.
 * תוויות אמיתיות: "קטע הקריאה", "קטע (המשך) — …", ולעיתים כותרת אנגלית של הקטע.
 * הבאג הקודם חיפש startsWith("הקטע") ולכן הכפתור/פאנל לא הופיעו אף פעם.
 */

export function isReadingPassageCard(opts: { label: string; body?: string | null }): boolean {
  const body = opts.body?.trim() ?? "";
  if (!body) return false;
  const label = opts.label.trim();

  // \b לא עובד עם עברית ב־JS (Hebrew ∉ \w) — בודקים תחילת מחרוזת במפורש
  if (/^ה?קטע(?:\s|$|[—\-–(:（])/.test(label) || /קטע\s*\(\s*המשך\s*\)/.test(label)) {
    return true;
  }

  // גוף שרובו blockquote אנגלי (אחרי כותרת ### אופציונלית)
  const contentLines = body
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() && !/^#{1,6}\s/.test(l.trim()));
  if (contentLines.length === 0) return false;
  const quoted = contentLines.filter((l) => /^\s*>/.test(l)).length;
  if (quoted < Math.ceil(contentLines.length * 0.7)) return false;
  const latin = (body.match(/[A-Za-z]/g) ?? []).length;
  return latin >= 40;
}
