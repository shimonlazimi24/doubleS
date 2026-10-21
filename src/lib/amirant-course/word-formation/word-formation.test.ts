import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WORD_FORMATION_LESSONS } from "../lesson-content/lesson-question-groups";
import { AMIRNET_CONTENT_MODULES, AMIRNET_SYNC_LESSON_REGISTRY } from "../amirnet-content-sync";
import { getWordFormationItem, getWordFormationTest, wordFormationTestCount, wordFormationTestLevels } from "./word-formation.server";
import { gradeTypedWord } from "./grade-word";

describe("word-formation lessons", () => {
  const lessonIds = new Set(AMIRNET_CONTENT_MODULES.flatMap((m) => m.lessons.map((l) => l.id)));

  it("every test has a lesson, with its markdown on disk and four questions", () => {
    expect(Object.keys(WORD_FORMATION_LESSONS)).toHaveLength(wordFormationTestCount());
    for (const [lessonId, { test }] of Object.entries(WORD_FORMATION_LESSONS)) {
      expect(lessonIds.has(lessonId), lessonId).toBe(true);
      const rel = AMIRNET_SYNC_LESSON_REGISTRY[lessonId]?.amirnetMarkdownRel;
      expect(rel && fs.existsSync(path.join(process.cwd(), "content/amirnet-course", rel)), lessonId).toBe(true);
      expect(getWordFormationTest(test), lessonId).toHaveLength(4);
    }
  });

  it("each lesson title states the level of its test, from the owner's index", () => {
    // Same scale as the other owner lessons (owner-sets.test.ts).
    const scale: [number, string][] = [[2.5, "קל"], [3.5, "קל-בינוני"], [4.25, "בינוני"], [5, "בינוני-קשה"], [5.75, "קשה"], [6.2, "קשה מאוד"]];
    const titles = new Map(AMIRNET_CONTENT_MODULES.flatMap((m) => m.lessons.map((l) => [l.id, l.title])));
    for (const [lessonId, { test }] of Object.entries(WORD_FORMATION_LESSONS)) {
      const levels = wordFormationTestLevels(test);
      expect(levels.every(Number.isFinite), `${lessonId} has questions without an index level`).toBe(true);
      const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
      const label = scale.find(([lim]) => mean < lim)?.[1] ?? "הקשה ביותר";
      expect(titles.get(lessonId), lessonId).toBe(`מבחן יצירת מילה ${test} (${label})`);
    }
  });

  it("sends the browser no answers", () => {
    for (const { test } of Object.values(WORD_FORMATION_LESSONS)) {
      for (const q of getWordFormationTest(test)) {
        expect(Object.keys(q).sort()).toEqual(["baseWord", "id", "n", "sentence"]);
        expect(q.sentence.match(/_{8}/g)).toHaveLength(1);
      }
    }
  });

  it("grades each key's own accepted forms as correct and its listed mistakes as wrong", () => {
    for (const { test } of Object.values(WORD_FORMATION_LESSONS)) {
      for (const q of getWordFormationTest(test)) {
        const key = getWordFormationItem(q.id)!;
        for (const f of key.accepted) expect(gradeTypedWord(key, f).isCorrect, `${q.id} ${f}`).toBe(true);
        for (const m of Object.keys(key.mistakes)) expect(gradeTypedWord(key, m).isCorrect, `${q.id} ${m}`).toBe(false);
      }
    }
  });
});
