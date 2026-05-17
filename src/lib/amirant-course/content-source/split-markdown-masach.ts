/**
 * מפצל מסמך MD לפי כותרות רמה-1 שמסמנות "מסמך" (למשל `# 📘 מסמך 1.1: ...`).
 * טקסט לפני המסמך הראשון (כותרת יחידה) מצורף לסקשן הראשון.
 */
const MASACH_H1 = /^#\s+.*מסמך\s+(\d+\.\d+)/;

export function splitMarkdownByMasachH1(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (MASACH_H1.test(lines[i])) starts.push(i);
  }
  if (starts.length === 0) return [markdown.trim()];

  const parts: string[] = [];
  const preDoc = lines.slice(0, starts[0]).join("\n").trim();
  for (let j = 0; j < starts.length; j++) {
    const from = starts[j];
    const to = j + 1 < starts.length ? starts[j + 1]! : lines.length;
    const block = lines.slice(from, to).join("\n").trim();
    if (j === 0 && preDoc) parts.push(`${preDoc}\n\n${block}`.trim());
    else parts.push(block);
  }
  return parts;
}

/**
 * לפני תצוגה: מסיר מ־H1…H6 רק את החלק "מסמך X.Y:" (והטקסט לפניו, כגון אימוג'י) — בלי לשנות את הטקסט הזמין למשתמש.
 * מבוסס־שורה כדי שלא יידרש RegExp יוניקוד (u) לתווי אימוג'י.
 */
function stripMasachFromHeadingLine(line: string): string {
  const m = line.match(/^(#{1,6}\s*).*?מסמך\s+[\d.]+\s*:\s*(.*)$/);
  if (m) {
    return `${m[1]!}${m[2]!}`.replace(/\s+$/, "");
  }
  return line;
}

export function stripMasachNumberingForDisplay(md: string): string {
  return md.split(/\r?\n/).map(stripMasachFromHeadingLine).join("\n");
}
