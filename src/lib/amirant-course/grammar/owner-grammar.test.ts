import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, getBankQuestionsByTag } from "../question-bank";
import { LESSON_QUESTION_GROUPS } from "../lesson-content/lesson-question-groups";
import { AMIRNET_SYNC_LESSON_REGISTRY, AMIRNET_CONTENT_MODULES } from "../amirnet-content-sync";
import { groupModuleLessons } from "../lesson-content/module-lesson-groups";
import { splitExplanation } from "../lesson-content/split-explanation";

type OwnerQuestion = {
  number: number;
  stem: string;
  options: string[];
  correct: number;
  shortHe: string;
  shortEn: string;
  fullHe: string;
  method: { nameHe: string; nameEn: string; he: string; en: string };
  whyNot: { option: string; he: string; en: string }[];
  finalNote?: string;
  words: { word: string; pronunciation: string; meaningHe: string }[];
};
type OwnerPackage = {
  howTo: string[];
  methods: { nameHe: string; nameEn: string; whenHe: string }[];
  tests: { number: number; questions: OwnerQuestion[] }[];
};

const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
const pkg: OwnerPackage = read("content/amirant-import/owner/grammar-tests.json");
const pad = (n: number) => String(n).padStart(2, "0");
// Emoji pictographs are surrogate pairs in the U+1F300–U+1FAFF range; the source's marks are ✓ ✗ 💡.
const ORNAMENT = /[\uD83C-\uD83E][\uDC00-\uDFFF]|[✓✗💡]/;

describe("owner grammar package (parsed JSON)", () => {
  it("is 12 tests of 4 questions, with the four methods and the how-to bullets", () => {
    expect(pkg.tests).toHaveLength(12);
    expect(pkg.tests.map((t) => t.number)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(pkg.tests.flatMap((t) => t.questions)).toHaveLength(48);
    expect(pkg.methods).toHaveLength(4);
    expect(pkg.howTo.length).toBeGreaterThanOrEqual(3);
  });

  it("every question has four options, a key inside them, a two-language explanation, a method and three why-nots", () => {
    const methodNames = new Set(pkg.methods.map((m) => m.nameHe));
    for (const t of pkg.tests) {
      expect(t.questions).toHaveLength(4);
      for (const q of t.questions) {
        const at = `t${t.number} q${q.number}`;
        expect(q.options, at).toHaveLength(4);
        expect(q.correct).toBeGreaterThanOrEqual(0);
        expect(q.correct).toBeLessThan(4);
        expect(q.stem).toContain("________");
        expect(q.shortHe.length).toBeGreaterThan(20);
        expect(q.shortEn.length).toBeGreaterThan(20);
        expect(q.fullHe.length).toBeGreaterThan(40);
        expect(methodNames.has(q.method.nameHe), at).toBe(true);
        expect(q.method.en.length).toBeGreaterThan(10);
        expect(q.whyNot).toHaveLength(3);
        const wrong = q.options.filter((_, i) => i !== q.correct);
        expect(q.whyNot.map((w) => w.option).sort()).toEqual(wrong.sort());
        expect(JSON.stringify(q)).not.toMatch(ORNAMENT);
      }
    }
  });
});

describe("owner grammar tests in the course", () => {
  const own = AMIRANT_BANK_QUESTIONS.filter((q) => q.tags?.includes("owner_gr"));

  it("are in the bank as 12 units of 4, topic grammar, each behind one four-minute lesson", () => {
    expect(own).toHaveLength(48);
    expect(own.every((q) => q.topicSlug === "grammar")).toBe(true);
    expect(own.every((q) => !q.passageId)).toBe(true);
    for (let n = 1; n <= 12; n++) {
      expect(getBankQuestionsByTag(`owner-gr-test-${n}`)).toHaveLength(4);
      const lessonId = `lesson.grammar.test-${pad(n)}`;
      expect(LESSON_QUESTION_GROUPS[lessonId]?.tag).toBe(`owner-gr-test-${n}`);
      expect(LESSON_QUESTION_GROUPS[lessonId]?.timeLimitSec).toBe(4 * 60);
      const rel = AMIRNET_SYNC_LESSON_REGISTRY[lessonId]?.amirnetMarkdownRel;
      expect(fs.existsSync(path.join(process.cwd(), "content/amirnet-course", rel ?? "")), lessonId).toBe(true);
    }
    expect(getBankQuestionsByTag("owner-gr-test-13")).toHaveLength(0);
  });

  it("climb from easy to hard across the twelve tests", () => {
    const means = Array.from({ length: 12 }, (_, i) => {
      const qs = getBankQuestionsByTag(`owner-gr-test-${i + 1}`);
      return qs.reduce((s, q) => s + q.difficulty, 0) / qs.length;
    });
    for (let i = 1; i < means.length; i++) expect(means[i]).toBeGreaterThanOrEqual(means[i - 1]);
    expect(means[0]).toBeLessThan(2.5);
    expect(means[11]).toBe(6);
  });

  it("carry the owner's explanation in the shape the quiz card splits: short open, full with the method and the why-not collapsed", () => {
    for (const q of own) {
      const parts = splitExplanation(q.explanation);
      expect(parts.short, q.id).toMatch(/^\*\*הסבר קצר:\*\*/);
      expect(parts.full).toMatch(/^\*\*הסבר מלא:\*\*/);
      expect(parts.full).toContain("שיטה: ");
      expect(parts.whyNot).toMatch(/^\*\*למה לא האפשרויות האחרות\*\*/);
      expect(parts.whyNot).toContain("**תשובה סופית: ");
      // The key's text closes the explanation, so a learner never sees a mismatch.
      const correct = q.options.find((o) => o.id === q.correctOptionId)!.label;
      expect(parts.whyNot).toContain(`**תשובה סופית: ${correct.replace(/([*_`])/g, "\\$1")}**`);
      // No emoji or source marks reach the learner.
      expect(q.explanation).not.toMatch(ORNAMENT);
      expect(q.tags?.some((t) => t.startsWith("method:GR-M"))).toBe(true);
    }
  });

  it("sit in the reform module as their own group, in order, right after the grammar guide", () => {
    const mod = AMIRNET_CONTENT_MODULES.find((m) => m.id === "mod-reform")!;
    const group = groupModuleLessons(mod).find((g) => g.key === "grammar")!;
    expect(group.title).toBe("מבחני דקדוק בהקשר");
    expect(group.lessons.map((l) => l.id)).toEqual(Array.from({ length: 12 }, (_, i) => `lesson.grammar.test-${pad(i + 1)}`));
    expect(group.lessons.every((l) => /^מבחן דקדוק בהקשר \d+ \(.+\)$/.test(l.title))).toBe(true);
    const ids = mod.lessons.map((l) => l.id);
    expect(ids[ids.indexOf("lesson.reform.06") + 1]).toBe("lesson.grammar.test-01");
    // The placeholder grammar practice (7.7) is superseded by the owner's tests.
    expect(ids).not.toContain("lesson.reform.07");
  });
});
