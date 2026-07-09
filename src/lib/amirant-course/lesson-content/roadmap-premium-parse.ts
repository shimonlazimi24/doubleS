/**
 * Parses Unit 1 roadmap markdown (6-week program + milestones) into structured data
 * for premium UI - same wording as source, no pedagogical changes.
 */

export type RoadmapTableRow = { day: string; task: string; time: string };

export type RoadmapWeekParsed = {
  weekIndex: number;
  /** e.g. "שבוע 1: יסודות והיכרות" */
  title: string;
  /** Day-by-day table rows when present */
  tableRows?: RoadmapTableRow[];
  /** Freeform lines (שבוע 3–5 style) */
  bodyParagraphs?: string[];
  /** From **סה"כ:** line in source */
  weekTotalLine?: string;
};

export type RoadmapMilestoneGroup = {
  title: string;
  items: string[];
};

const WEEK_HEADER = /###\s*שבוע\s*(\d+)\s*:\s*([^\n]+)/g;

function parseMarkdownTable(tableBlock: string): RoadmapTableRow[] {
  const lines = tableBlock.split("\n").map((l) => l.trim());
  const rows: RoadmapTableRow[] = [];
  for (const line of lines) {
    if (!line.startsWith("|") || /^\|[\s\-:|]+\|?$/.test(line)) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cells.length < 3) continue;
    if (/יום|משימה|זמן/.test(cells[0] ?? "")) continue;
    rows.push({ day: cells[0] ?? "", task: cells[1] ?? "", time: cells[2] ?? "" });
  }
  return rows;
}

/** Sums "X.X שעות" cells; returns a compact display line. */
function formatWeekHoursFromTableRows(rows: RoadmapTableRow[]): string | undefined {
  if (!rows.length) return undefined;
  let total = 0;
  for (const r of rows) {
    const t = (r.time ?? "").replace(/\s/g, " ");
    const m = t.match(/([\d.]+)\s*שעות?/);
    if (m) total += Number.parseFloat(m[1]!);
  }
  if (total <= 0) return undefined;
  const rounded = Number.isInteger(total) ? String(total) : String(Math.round(total * 10) / 10);
  return `⏱ ~${rounded} שעות`;
}

const GLOBAL_TOTAL = /\*\*סה["״]כ:?\*\*[^\n]*/;

/**
 * Splits the 6-week program section (from ה2 עד הטבלאות) into week blocks.
 * Program-wide total line (after all weeks) is not attached to every week.
 */
export function parseSixWeekProgramMarkdown(plan6: string): { weeks: RoadmapWeekParsed[]; programTotalLine?: string } {
  const text = plan6.replace(/\r\n/g, "\n").trim();
  if (!text) return { weeks: [] };

  const globalTotal = text.match(GLOBAL_TOTAL);
  const programTotalLine = globalTotal ? globalTotal[0].replace(/\*\*/g, "").trim() : undefined;

  const weeks: RoadmapWeekParsed[] = [];
  const reWeek = new RegExp(WEEK_HEADER.source, "g");
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = reWeek.exec(text)) !== null) {
    matches.push(m);
  }
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const weekIndex = Number(m[1]);
    const titlePart = (m[2] ?? "").trim();
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : text.length;
    const block = text.slice(start, end).trim();

    const hasTable = /^\s*\|/m.test(block) && /\|/.test(block);
    if (hasTable) {
      const tableMatch = block.match(/((?:^|\n)\|[^\n]+\|(?:\n\|[^\n]+\|)+)/);
      const tableBlock = tableMatch ? tableMatch[0] : block;
      const tableRows = parseMarkdownTable(tableBlock);
      const rest = tableMatch ? block.slice(tableMatch.index! + tableMatch[0].length).trim() : "";
      const bodyParagraphs = rest
        ? rest
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined;
      const weekDurationLine = tableRows.length ? formatWeekHoursFromTableRows(tableRows) : undefined;
      weeks.push({
        weekIndex,
        title: `שבוע ${weekIndex}: ${titlePart}`,
        tableRows: tableRows.length ? tableRows : undefined,
        bodyParagraphs: bodyParagraphs?.length ? bodyParagraphs : undefined,
        weekTotalLine: weekDurationLine,
      });
    } else {
      const bodyLines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^---+$/.test(l));
      const fromBullets = bodyLines
        .filter((l) => l.startsWith("- "))
        .map((l) => l.replace(/^-\s+/, "").replace(/\*\*/g, "").trim());
      const bodyParagraphs = fromBullets.length
        ? fromBullets
        : bodyLines
            .map((l) => l.replace(/\*\*/g, "").trim())
            .filter(Boolean);
      weeks.push({
        weekIndex,
        title: `שבוע ${weekIndex}: ${titlePart}`,
        bodyParagraphs: bodyParagraphs.length ? bodyParagraphs : undefined,
      });
    }
  }

  return { weeks: weeks.sort((a, b) => a.weekIndex - b.weekIndex), programTotalLine };
}

/**
 * Extracts milestone checkbox groups (## 🎯 יעדי אבן דרך … ### סוף שבוע N).
 */
export function parseMilestonesMarkdown(milestones: string): RoadmapMilestoneGroup[] {
  const t = milestones.replace(/\r\n/g, "\n");
  if (!t.trim()) return [];
  const groups: RoadmapMilestoneGroup[] = [];
  const parts = t.split(/(?=###\s*סוף שבוע)/g);
  for (const part of parts) {
    const p = part.trim();
    if (!p.startsWith("###")) continue;
    const firstLine = p.split("\n")[0] ?? "";
    const title = firstLine.replace(/^###\s+/, "").replace(/\*\*/g, "").trim();
    const items: string[] = [];
    for (const line of p.split("\n")) {
      const s = line.trim();
      if (!/^-/.test(s) && !/^\[/.test(s)) continue;
      const task = s
        .replace(/^-\s*/, "")
        .replace(/^\[\s*[ xX]?\s*\]\s*/, "")
        .replace(/\*\*/g, "")
        .trim();
      if (task && !/^#{1,6}/.test(task)) items.push(task);
    }
    if (title && items.length) groups.push({ title, items });
  }
  return groups;
}

export type RoadmapStepPayload = {
  introShort: string;
  weeks: RoadmapWeekParsed[];
  milestoneGroups: RoadmapMilestoneGroup[];
  tracking: { headers: string[]; rows: string[][] } | null;
  /** One line e.g. סה"כ ~63 שעות - from source */
  programTotalLine?: string;
};

/**
 * 2–3 line intro: first paragraph of intro / structure context, stripped of # and pipes.
 */
export function shortIntroFromPageIntro(pageIntro: string, maxLen = 320): string {
  const one = pageIntro
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)[0]
    ?.replace(/^#+\s+/gm, "")
    .replace(/\|/g, " · ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
  if (one.length <= maxLen) return one;
  const cut = one.slice(0, maxLen);
  const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (last > 40) return cut.slice(0, last + 1).trim();
  return cut.trim() + "…";
}

/**
 * 2–3 line intro: section titles (H2) from the roadmap doc - all verbatim, no new facts.
 */
export function buildRoadmapStructureIntroShort(sections: { title: string }[], pageIntro: string): string {
  const matchFns = [
    (t: string) => /🗺|תוכנית.*6|6 שבועות/.test(t),
    (t: string) => /יעדי אבן|אבן דרך/.test(t),
    (t: string) => /מעקב אישי|מעקב/.test(t),
  ];
  const lines: string[] = [];
  for (const f of matchFns) {
    const s = sections.find((x) => f(x.title));
    if (s?.title) lines.push(s.title.replace(/\*\*/g, "").replace(/^#+\s+/, "").trim());
  }
  if (lines.length) return lines.join("\n");
  return shortIntroFromPageIntro(pageIntro, 400);
}

/** Simple pipe-table → rows for מעקב אישי (4 columns). */
export function parseTrackingTableMarkdown(tracking: string): { headers: string[]; rows: string[][] } | null {
  const t = tracking.replace(/\r\n/g, "\n");
  const tableMatch = t.match(/((?:^|\n)\|[^\n]+\|(?:\n\|[^\n]+\|)+)/m);
  if (!tableMatch) return null;
  const lines = tableMatch[0].split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return null;
  const parseRow = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
  const header = parseRow(lines[0]!);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = parseRow(lines[i]!);
    if (/^[-–—:| ]+$/.test(lines[i]!)) continue;
    if (r.length) rows.push(r);
  }
  if (!header.length) return null;
  return { headers: header, rows };
}
