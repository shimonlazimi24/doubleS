/**
 * Derives structured fields from a vocabulary entry's `fullMd` (same source as parse-vocabulary-markdown).
 * Display-only - does not change stored curriculum.
 */

export type StructuredVocabEntry = {
  index: number;
  /** English headword, e.g. "be" */
  word: string;
  /** e.g. "(v.)", "(n.)" - may be empty */
  posLabel: string;
  /** First line after H3, markdown-ish title fragment for header */
  titleDisplay: string;
  definition: string;
  translation: string;
  examples: string[];
  synonyms: string;
  antonyms: string;
  memoryTip: string;
};

const H3_LINE = /^\s*###\s*(\d+)\.\s*(.+)$/m;

function firstBold(s: string): string {
  const m = s.match(/\*\*([^*]+)\*\*/);
  return m ? m[1]!.trim() : "";
}

function lineValue(line: string): string {
  const idx = line.indexOf(":");
  if (idx < 0) return line.trim();
  return line
    .slice(idx + 1)
    .trim()
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

function classifyLine(line: string): keyof Omit<StructuredVocabEntry, "index" | "word" | "posLabel" | "titleDisplay"> | null {
  const t = line.trim();
  if (/^\s*[-*•]\s*\*?\*?Definition/i.test(t)) return "definition";
  if (/תרגום/i.test(t) && /^\s*[-*•]/.test(t)) return "translation";
  if (/\*\*Example\s*\d/i.test(t) || /Example\s*\d/i.test(t)) return "examples";
  if (/Synonyms/i.test(t)) return "synonyms";
  if (/Antonyms/i.test(t)) return "antonyms";
  if (/Memory tip|💡|טיפ לזכרון/i.test(t)) return "memoryTip";
  return null;
}

/**
 * Parse `fullMd` into tab-friendly fields. Falls back to empty strings when lines are missing.
 */
export function structureVocabEntry(fullMd: string, fallbackWord: string, fallbackTranslation: string, index: number): StructuredVocabEntry {
  const lines = fullMd.replace(/\r\n/g, "\n").split("\n");
  const first = lines[0] ?? "";
  const h3 = first.match(H3_LINE);
  const idx = h3 ? parseInt(h3[1]!, 10) : index;
  const restOfTitle = h3 ? h3[2]!.trim() : first.replace(/^\s*#+\s*\d*\.?\s*/, "").trim();

  const word = firstBold(restOfTitle) || fallbackWord;
  const posM = restOfTitle.match(/\(([^)]+)\)\s*$/);
  const posLabel = posM ? `(${posM[1]})` : "";

  const out: StructuredVocabEntry = {
    index: idx || index,
    word,
    posLabel,
    titleDisplay: restOfTitle,
    definition: "",
    translation: fallbackTranslation,
    examples: [],
    synonyms: "",
    antonyms: "",
    memoryTip: "",
  };

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i]!;
    const t = raw.trim();
    if (!t.startsWith("-") && !t.startsWith("*")) continue;
    const kind = classifyLine(t);
    if (!kind) continue;
    const val = lineValue(t);
    if (kind === "examples") {
      if (val) out.examples.push(val);
    } else if (kind === "definition") {
      out.definition = out.definition ? `${out.definition}\n${val}` : val;
    } else if (kind === "translation") {
      out.translation = val || out.translation;
    } else if (kind === "synonyms") {
      out.synonyms = val;
    } else if (kind === "antonyms") {
      out.antonyms = val;
    } else if (kind === "memoryTip") {
      out.memoryTip = val;
    }
  }

  if (!out.translation || out.translation === "-") {
    out.translation = fallbackTranslation;
  }

  return out;
}

export function hasStructuredContent(s: StructuredVocabEntry): boolean {
  return Boolean(
    s.definition || s.examples.length || s.synonyms || s.antonyms || s.memoryTip || (s.translation && s.translation !== "-"),
  );
}
