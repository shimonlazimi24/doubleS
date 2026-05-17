/**
 * Canonical structured vocabulary model for premium UI — derived from parsed MD only.
 */

import type { VocabEntryData, VocabParseResult } from "./parse-vocabulary-markdown";
import type { PackageStatRow } from "./parse-vocab-package-table";
import { parsePackageOverviewRows } from "./parse-vocab-package-table";
import { structureVocabEntry } from "./vocab-entry-structure";

export type { PackageStatRow } from "./parse-vocab-package-table";

export type VocabularyLevel = "easy" | "intermediate" | "advanced" | "expert";

export type VocabularyWord = {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  translation: string;
  examples: string[];
  synonyms?: string[];
  antonyms?: string[];
  memoryTip?: string;
  /** Section heading (Hebrew), for display */
  category?: string;
  /** Stable id matching {@link VocabularyCategory.id} */
  categoryId?: string;
  level?: VocabularyLevel;
  /** Original order in lesson */
  order: number;
};

export type VocabularyCategory = {
  id: string;
  title: string;
  count: number;
};

export type VocabularyLessonModel = {
  words: VocabularyWord[];
  categories: VocabularyCategory[];
  packageStats: PackageStatRow[];
  level: VocabularyLevel;
  wordCount: number;
};

function splitSynonymsLine(s: string): string[] | undefined {
  const t = s.replace(/\*\*/g, "").trim();
  if (!t) return undefined;
  return t
    .split(/[,،]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function inferLevel(lessonId: string, lessonTitle: string): VocabularyLevel {
  const t = lessonTitle.toLowerCase();
  if (/מומחה|expert|vocabulary_4|lesson\.vocab\.1[3-6]/.test(lessonId) || /מומחה/.test(lessonTitle)) {
    return "expert";
  }
  if (/מתקדמ|advanced|vocabulary_3|lesson\.vocab\.(09|10|11|12)/.test(lessonId) || /מתקדמ/.test(lessonTitle)) {
    return "advanced";
  }
  if (/בינוני|intermediate|vocabulary_2|lesson\.vocab\.(05|06|07|08)/.test(lessonId) || /בינוני/.test(lessonTitle)) {
    return "intermediate";
  }
  if (/קל|easy|vocabulary_1|lesson\.vocab\.(01|02|03|04)/.test(lessonId) || /קל/.test(lessonTitle)) {
    return "easy";
  }
  if (/mastery|5_mastery|lesson\.vocab\.19/.test(lessonId)) return "expert";
  if (/phrasal|connectives|lesson\.vocab\.(17|18)/.test(lessonId)) return "advanced";
  return "intermediate";
}

function cleanSectionTitle(headingLine: string): string {
  return headingLine
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/🟢|📘|🎯|🗺️/g, "")
    .trim();
}

/**
 * Single pass: map each parsed entry to {@link VocabularyWord} with stable ids and categories.
 */
export function buildVocabularyLessonModel(
  lessonId: string,
  parsed: VocabParseResult,
  opts: { lessonTitle: string },
): VocabularyLessonModel {
  const level = inferLevel(lessonId, opts.lessonTitle);
  const packageStats = parsePackageOverviewRows(parsed.preambleMd);

  const categories: VocabularyCategory[] = [];
  const words: VocabularyWord[] = [];
  let order = 0;

  parsed.sections.forEach((section, sIdx) => {
    const title = cleanSectionTitle(section.headingLine) || `קטגוריה ${sIdx + 1}`;
    const catId = `cat-${sIdx}`;
    categories.push({
      id: catId,
      title,
      count: section.entries.length,
    });

    section.entries.forEach((entry: VocabEntryData) => {
      const s = structureVocabEntry(entry.fullMd, entry.word, entry.translation, entry.n);
      const pos = s.posLabel.replace(/^\(|\)$/g, "").trim() || "—";
      const syns = splitSynonymsLine(s.synonyms);
      const ants = splitSynonymsLine(s.antonyms);

      words.push({
        id: `${lessonId}-w${order}-${entry.n}`,
        word: s.word,
        partOfSpeech: pos,
        definition: s.definition,
        translation: s.translation,
        examples: [...s.examples],
        synonyms: syns,
        antonyms: ants,
        memoryTip: s.memoryTip.trim() || undefined,
        category: title,
        categoryId: catId,
        level,
        order,
      });
      order++;
    });
  });

  return {
    words,
    categories,
    packageStats,
    level,
    wordCount: words.length,
  };
}

/** For flash/memory: minimal pairs from structured words */
export function wordsToFlashPairs(words: VocabularyWord[]): { word: string; translation: string; n: number }[] {
  return words.map((w, i) => ({
    word: w.word,
    translation: w.translation || "—",
    n: i + 1,
  }));
}
