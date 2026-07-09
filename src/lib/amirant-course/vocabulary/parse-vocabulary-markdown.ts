/**
 * פרסר לתוכן שיעורי "אוצר מילים": כותרות H2, ואז מקטעי `### 1. **word**` …
 * משמשים ל־UI של קורס, כרטיסיות ומשחק - בלי שינוי קבצי ה־MD.
 */

import { stripMasachNumberingForDisplay } from "../content-source/split-markdown-masach";

export type VocabEntryData = {
  n: number;
  /** הטקסט המלא של המקטע כולו (כולל `###` הראשון) */
  fullMd: string;
  word: string;
  translation: string;
};

export type VocabSectionData = {
  /** שורה מלאה של הכותרת, לדוגמה `## 🟢 Section A1: …` */
  headingLine: string;
  introMd: string;
  entries: VocabEntryData[];
};

export type VocabParseResult = {
  preambleMd: string;
  sections: VocabSectionData[];
  /** שטוח, ללמידה אדפטיבית / כרטיסיות (בסדר מסמך) */
  allEntries: VocabEntryData[];
};

const H2 = /^##(?!#)/;
const H3_NUM = /^\s*###\s+(\d+)\.(\s+|$)/;

/**
 * הכי נפוץ: `**achieve**` - נשלף את הראשון בשורת ה־H3
 */
export function extractVocabEntryWord(entryMd: string): string {
  const first = entryMd.split(/\r?\n/)[0] ?? "";
  const bold = first.match(/\*\*([^*]+?)\*\*/);
  if (bold) return bold[1].trim();
  return first
    .replace(H3_NUM, "")
    .replace(/^\s*#+\s*/, "")
    .trim() || "-";
}

/**
 * שורה עם "תרגום" (בדרך־כלל בולט עם **תרגום:**)
 */
export function extractVocabHebrewTranslation(entryMd: string): string {
  for (const raw of entryMd.split("\n")) {
    const line = raw.trim();
    if (!/תרגום/i.test(line)) continue;
    const s = line.replace(/^\s*[-*•]\s*/, "");
    const m1 = s.match(/\*?\*?תרגום:?\*?\*?\s*[:：]?\s*(.+?)\s*$/i);
    if (m1) {
      return m1[1].replace(/^\*\*|\*\*$/g, "").replace(/\*\*/g, "").trim() || "-";
    }
  }
  return "-";
}

function makeEntryData(fullMd: string, n: number): VocabEntryData {
  return {
    n,
    fullMd: fullMd.trim(),
    word: extractVocabEntryWord(fullMd),
    translation: extractVocabHebrewTranslation(fullMd),
  };
}

function splitEntryLines(entryLines: string[]): VocabEntryData[] {
  if (entryLines.length === 0) return [];
  const chunks: string[] = [];
  let cur: string[] = [];
  for (const line of entryLines) {
    if (H3_NUM.test(line)) {
      if (cur.length) chunks.push(cur.join("\n"));
      cur = [line];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) chunks.push(cur.join("\n"));

  return chunks
    .map((chunk) => {
      const m = chunk.match(H3_NUM);
      const n = m?.[1] != null ? parseInt(m[1]!, 10) : 0;
      return makeEntryData(chunk, n);
    })
    .filter((e) => e.n > 0);
}

/**
 * @param body תוכן MD (אפשר אחרי stripMasach/פיצול סקשן)
 */
export function parseVocabularyMarkdown(body: string): VocabParseResult {
  const md = stripMasachNumberingForDisplay(body);
  const lines = md.split(/\r?\n/);
  const h2Indices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (H2.test(lines[i]!)) h2Indices.push(i);
  }

  if (h2Indices.length === 0) {
    return { preambleMd: md.trim(), sections: [], allEntries: [] };
  }

  const preambleLines = h2Indices[0]! > 0 ? lines.slice(0, h2Indices[0]!) : [];
  const preambleMd = preambleLines.join("\n").trim();

  const sections: VocabSectionData[] = [];
  for (let s = 0; s < h2Indices.length; s++) {
    const a = h2Indices[s]!;
    const b = s + 1 < h2Indices.length ? h2Indices[s + 1]! : lines.length;
    const block = lines.slice(a, b);
    const headingLine = (block[0] ?? "##").trim();
    const rest = block.slice(1);

    let firstEntry = -1;
    for (let j = 0; j < rest.length; j++) {
      if (H3_NUM.test(rest[j]!)) {
        firstEntry = j;
        break;
      }
    }
    if (firstEntry < 0) {
      sections.push({ headingLine, introMd: rest.join("\n").trim(), entries: [] });
      continue;
    }
    const introMd = rest.slice(0, firstEntry).join("\n").trim();
    const entryLines = rest.slice(firstEntry);
    const entries = splitEntryLines(entryLines);
    sections.push({ headingLine, introMd, entries });
  }

  const allEntries: VocabEntryData[] = [];
  for (const se of sections) {
    for (const e of se.entries) {
      allEntries.push(e);
    }
  }
  return { preambleMd, sections, allEntries };
}

export function vocabularyBodyHasNumberedWordEntries(r: VocabParseResult): boolean {
  return r.allEntries.length > 0;
}
