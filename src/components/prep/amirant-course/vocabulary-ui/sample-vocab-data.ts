import type { VocabEntryData, VocabParseResult } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";

/**
 * Minimal sample for tests / Storybook / demos — mirrors real MD shape from `03_vocabulary/*.md`.
 *
 * @example
 * ```tsx
 * import { VocabularyLessonExperience } from "../VocabularyLessonExperience";
 * import { sampleVocabLesson } from "./sample-vocab-data";
 * <VocabularyLessonExperience
 *   data={sampleVocabLesson}
 *   lessonId="lesson.vocab.demo"
 *   title="דוגמת אוצר מילים"
 *   estimatedMinutes={20}
 * />
 * ```
 */
export const sampleVocabEntries: VocabEntryData[] = [
  {
    n: 1,
    word: "be",
    translation: "להיות",
    fullMd: `### 1. **be** (v.)
- **Definition:** to exist; to have a particular quality or state
- **תרגום:** להיות
- **Example 1:** I **am** a student at the university.
- **Example 2:** The book **is** on the table.
- **Synonyms:** exist, remain
- **Antonyms:** (none - unique verb)
- **💡 Memory tip:** הפועל הכי בסיסי באנגלית.`,
  },
  {
    n: 2,
    word: "have",
    translation: "להיות ל-, להחזיק",
    fullMd: `### 2. **have** (v.)
- **Definition:** to possess or own; to experience
- **תרגום:** להיות ל-, להחזיק
- **Example 1:** She **has** two brothers.
- **Example 2:** We **have** a meeting at 3 PM.
- **Synonyms:** possess, own
- **Antonyms:** lack
- **💡 Memory tip:** Forms: have/has/had.`,
  },
];

export const sampleVocabLesson: VocabParseResult = {
  preambleMd: `## 📋 מבנה החבילה

| סוג מילה | מספר מילים | מתאים ל- |
|---|---|---|
| **פעלים** | 2 | דוגמה |
| **סה״כ** | **2** | |

טקסט הקדמה קצר לפני המילים.`,
  sections: [
    {
      headingLine: "## 🟢 Section A: דוגמה",
      introMd: "פסקת מבוא קצרה לקטגוריה.",
      entries: sampleVocabEntries,
    },
  ],
  allEntries: sampleVocabEntries,
};
