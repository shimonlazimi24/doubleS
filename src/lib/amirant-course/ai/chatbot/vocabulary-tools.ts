import { AMIRANT_LESSON_REGISTRY } from "../../lesson-registry";
import { readAmirantCourseMarkdownSource } from "@/lib/prep/amirnet-materials.server";
import {
  extractVocabEntryWord,
  extractVocabHebrewTranslation,
  parseVocabularyMarkdown,
} from "../../vocabulary/parse-vocabulary-markdown";

export type VocabIndexRow = {
  wordNorm: string;
  word: string;
  translation: string;
  level: "easy" | "medium" | "hard" | "expert" | "mastery" | "unknown";
  sectionHeading: string;
  lessonId: string;
  fullMd: string;
};

let cachedIndex: Map<string, VocabIndexRow[]> | null = null;

function inferLevelFromPath(rel: string): VocabIndexRow["level"] {
  if (/5_mastery|mastery/i.test(rel)) return "mastery";
  if (/_1_easy|1_easy/i.test(rel) || /easy_part/.test(rel)) return "easy";
  if (/_2_intermediate|2_intermediate/i.test(rel) || /intermediate_part/.test(rel)) return "medium";
  if (/_3_advanced|3_advanced/i.test(rel) || /advanced_part/.test(rel) || /phrasal|connectives/.test(rel))
    return "hard";
  if (/_4_expert|4_expert|expert_part/.test(rel)) return "expert";
  if (/SAMPLE_100|package_100/.test(rel)) return "unknown";
  return "unknown";
}

/**
 * Scans all vocabulary MD lessons in the static registry; lazy-cached in memory.
 */
function buildVocabIndex(): Map<string, VocabIndexRow[]> {
  const map = new Map<string, VocabIndexRow[]>();
  for (const [lessonId, content] of Object.entries(AMIRANT_LESSON_REGISTRY)) {
    if (!lessonId.startsWith("lesson.vocab.")) continue;
    const rel = content.amirnetMarkdownRel;
    if (!rel) continue;
    const read = readAmirantCourseMarkdownSource(rel);
    if (!read.ok) continue;
    const parsed = parseVocabularyMarkdown(read.body);
    for (const entry of parsed.allEntries) {
      const w = extractVocabEntryWord(entry.fullMd).toLowerCase();
      if (!w || w === "-") continue;
      const row: VocabIndexRow = {
        wordNorm: w,
        word: entry.word,
        translation: extractVocabHebrewTranslation(entry.fullMd),
        level: inferLevelFromPath(rel),
        sectionHeading: findHeadingForEntry(parsed, entry),
        lessonId,
        fullMd: entry.fullMd,
      };
      const arr = map.get(w) ?? [];
      arr.push(row);
      map.set(w, arr);
    }
  }
  return map;
}

function findHeadingForEntry(
  parsed: ReturnType<typeof parseVocabularyMarkdown>,
  entry: { n: number; fullMd: string },
): string {
  for (const se of parsed.sections) {
    for (const e of se.entries) {
      if (e.n === entry.n && e.fullMd === entry.fullMd) return se.headingLine;
    }
  }
  return "";
}

export function getVocabularyIndex(): Map<string, VocabIndexRow[]> {
  if (cachedIndex) return cachedIndex;
  try {
    cachedIndex = buildVocabIndex();
  } catch {
    cachedIndex = new Map();
  }
  return cachedIndex;
}

const LEVEL_HE: Record<VocabIndexRow["level"], string> = {
  easy: "קל",
  medium: "בינוני",
  hard: "מתקדם",
  expert: "רמה גבוהה מאוד",
  mastery: "מאסטרי",
  unknown: "לא מסווג",
};

/**
 * Returns formatted answer in Hebrew, or `null` if the word is not in the in-repo vocabulary lessons.
 */
export function formatVocabLookupReply(wordNorm: string, opts?: { quiz: boolean; related: boolean }): string | null {
  const index = getVocabularyIndex();
  const rows = index.get(wordNorm.toLowerCase().trim());
  if (!rows?.length) return null;

  const r = rows[0]!;
  const related =
    rows.length > 1
      ? `שורות נוספות: ${rows
          .slice(1, 4)
          .map((x) => x.word)
          .join(", ")}.`
      : "";
  const tags = r.sectionHeading.replace(/^##\s*/, "").slice(0, 120) || "-";
  const quiz = opts?.quiz
    ? `מיני־מבחן: נסו לשחזר משפט בעברית למילה **${r.word}** (בלי לפתוח את הכרטיסיה) ורק אז בדקו מול \"תרגום\" למעלה.`
    : "";

  return [
    `**${r.word}** (במאגר אוצר מילים של הקורס)`,
    `- תרגום (מהחומר): ${r.translation}`,
    `- רמה: ${LEVEL_HE[r.level] ?? "לא מסווג"}`,
    `- תג/נושא: ${tags}${related ? ` · ${related}` : ""}`,
    r.fullMd.length < 2000
      ? `\n---\nקטע מקור (מהמסמך, עשוי להכיל שורות הוראה / דוגמא):`
      : "\n(קטע מלא זמין בשיעורי האוצר).",
    r.fullMd.length < 2000 ? r.fullMd : "",
    quiz,
  ]
    .filter((x) => x.length > 0)
    .join("\n");
}

/**
 * Suggest up to 5 other words in the same H2 block (same file match).
 */
export function suggestRelatedWords(wordNorm: string, limit = 5): string[] {
  const index = getVocabularyIndex();
  const rows = index.get(wordNorm.toLowerCase().trim());
  if (!rows?.length) return [];
  const target = rows[0]!;
  const sameHeading =
    target.sectionHeading.trim().length > 0
      ? Array.from(index.values())
          .flat()
          .filter(
            (x) => x.wordNorm !== target.wordNorm && x.sectionHeading && x.sectionHeading === target.sectionHeading,
          )
      : [];
  return Array.from(new Set(sameHeading.map((x) => x.word))).slice(0, limit);
}
