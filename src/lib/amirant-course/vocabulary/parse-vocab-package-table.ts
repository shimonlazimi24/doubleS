/**
 * Extracts simple stat rows from a markdown preamble that contains a GFM pipe table.
 */

export type PackageStatRow = { label: string; value: string; note?: string };

function splitCells(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !/^[-:\s]+$/.test(c));
}

/**
 * Returns up to the first plausible stats table in `preambleMd`, or [].
 */
/**
 * Removes the first contiguous GFM-style pipe-table block so stats can be shown as cards separately.
 */
export function stripFirstMarkdownTable(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length && !lines[i]!.trim().startsWith("|")) {
    i++;
  }
  if (i >= lines.length) return md.trim();
  const start = i;
  while (i < lines.length && lines[i]!.trim().startsWith("|")) {
    i++;
  }
  const out = [...lines.slice(0, start), ...lines.slice(i)].join("\n");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function parsePackageOverviewRows(preambleMd: string): PackageStatRow[] {
  const text = preambleMd.replace(/\r\n/g, "\n");
  const blocks = text.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim().startsWith("|"));
    if (lines.length < 2) continue;
    const rows: PackageStatRow[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^\|[\s\-:|]+\|?$/.test(line)) continue;
      const cells = splitCells(line);
      if (cells.length < 2) continue;
      const label = cells[0]!.replace(/\*\*/g, "").trim();
      const value = cells[1]!.replace(/\*\*/g, "").trim();
      const note = cells[2]?.replace(/\*\*/g, "").trim();
      if (/סוג מילה|מספר מילים|מתאים ל|^[-|]+$|^\|?-+\|?$/i.test(label)) continue;
      if (label && value) rows.push({ label, value, note });
    }
    if (rows.length) return rows;
  }
  return [];
}
