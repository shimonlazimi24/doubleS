import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, getBankQuestionsByTag, getPassage } from "../question-bank";
import { toClientPassage } from "../question-bank/for-client.server";
import { getListeningAudioClip } from "../listening-audio/manifest";
import { LESSON_QUESTION_GROUPS } from "../lesson-content/lesson-question-groups";
import { AMIRNET_SYNC_LESSON_REGISTRY, AMIRNET_CONTENT_MODULES } from "../amirnet-content-sync";
import { groupModuleLessons } from "../lesson-content/module-lesson-groups";

type OwnerTest = {
  test: number;
  clips: { index: number; clipId: string; level: number; context: string; transcript: string[]; questionNumbers: number[] }[];
  questions: { number: number; clipIndex: number; stem: string; options: string[]; correctIndex: number; explanationHe: string; explanationEn: string }[];
  vocab: { word: string; pronunciation: string; he: string; en: string }[];
};
type OwnerClip = { id: string; level: number; seconds: number; words: number; speakers: string; voice: string; script: { speaker: string | null; text: string }[] };

const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
const tests: OwnerTest[] = read("content/amirant-import/owner/listening-tests.json");
const clips: OwnerClip[] = read("content/amirant-import/owner/listening-clips.json");
const pad = (n: number) => String(n).padStart(2, "0");

describe("owner listening package (parsed JSON)", () => {
  it("is 14 tests, 42 clips, 70 questions, every clip used once", () => {
    expect(tests).toHaveLength(14);
    expect(clips).toHaveLength(42);
    expect(tests.flatMap((t) => t.questions)).toHaveLength(70);
    const used = tests.flatMap((t) => t.clips.map((c) => c.clipId));
    expect(new Set(used).size).toBe(42);
    expect(new Set(clips.map((c) => c.id))).toEqual(new Set(used));
  });

  it("every question has four options, a key inside them, and a two-language explanation", () => {
    for (const t of tests) {
      expect(t.clips).toHaveLength(3);
      expect(t.questions).toHaveLength(5);
      for (const q of t.questions) {
        expect(q.options, `t${t.test} q${q.number}`).toHaveLength(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.explanationHe.length).toBeGreaterThan(20);
        expect(q.explanationEn.length).toBeGreaterThan(20);
        expect(t.clips.some((c) => c.index === q.clipIndex)).toBe(true);
      }
    }
  });

  it("every recording brief has a voice direction and a script that matches its transcript", () => {
    const byId = new Map(clips.map((c) => [c.id, c]));
    for (const t of tests) {
      for (const c of t.clips) {
        const b = byId.get(c.clipId)!;
        expect(b.voice.length, c.clipId).toBeGreaterThan(30);
        expect(b.script.length).toBeGreaterThan(0);
        const norm = (s: string) => s.replace(/\[pause\]/g, "").replace(/[AB]:\s*/g, "").replace(/[^\w]/g, "").toLowerCase();
        expect(norm(b.script.map((s) => s.text).join(" "))).toBe(norm(c.transcript.join(" ")));
      }
    }
  });
});

describe("owner listening tests in the course", () => {
  const own = AMIRANT_BANK_QUESTIONS.filter((q) => q.tags?.includes("owner_ls"));

  it("are in the bank as 14 units of 5, topic listening, each behind one lesson", () => {
    expect(own).toHaveLength(70);
    expect(own.every((q) => q.topicSlug === "listening")).toBe(true);
    for (let n = 1; n <= 14; n++) {
      expect(getBankQuestionsByTag(`owner-ls-test-${n}`)).toHaveLength(5);
      const lessonId = `lesson.listening.test-${pad(n)}`;
      expect(LESSON_QUESTION_GROUPS[lessonId]?.tag).toBe(`owner-ls-test-${n}`);
      expect(LESSON_QUESTION_GROUPS[lessonId]?.timeLimitSec).toBe(7 * 60);
      const rel = AMIRNET_SYNC_LESSON_REGISTRY[lessonId]?.amirnetMarkdownRel;
      expect(fs.existsSync(path.join(process.cwd(), "content/amirnet-course", rel ?? "")), lessonId).toBe(true);
    }
    expect(getBankQuestionsByTag("owner-ls-test-15")).toHaveLength(0);
  });

  it("each question points at a clip passage with an audio player, a context line and a transcript the browser only gets to reveal", () => {
    for (const q of own) {
      const p = getPassage(q.passageId ?? "");
      expect(p, q.id).toBeTruthy();
      expect(p!.bodyMarkdown).toMatch(/^\{\{audio:ls-LL-L\d-\d{4}\|/);
      expect(p!.revealMarkdown).toContain("**תמליל הקטע**");
      const client = toClientPassage(p!.passageId)!;
      expect(client.revealMarkdown).toBe(p!.revealMarkdown);
      const clipId = p!.bodyMarkdown.match(/\{\{audio:(ls-[^|]+)\|/)![1];
      expect(getListeningAudioClip(clipId), clipId).toBeTruthy();
      // No emoji reach the learner.
      // Emoji pictographs are surrogate pairs in the U+1F300–U+1FAFF range.
      expect(`${p!.bodyMarkdown}${p!.revealMarkdown}${q.explanation}`).not.toMatch(/[\uD83C-\uD83E][\uDC00-\uDFFF]/);
    }
  });

  it("sit in the reform module as their own group, in order", () => {
    const mod = AMIRNET_CONTENT_MODULES.find((m) => m.id === "mod-reform")!;
    const group = groupModuleLessons(mod).find((g) => g.key === "listening")!;
    expect(group.title).toBe("מבחני האזנה");
    expect(group.lessons.map((l) => l.id)).toEqual(Array.from({ length: 14 }, (_, i) => `lesson.listening.test-${pad(i + 1)}`));
    expect(group.lessons.every((l) => /^מבחן האזנה \d+ \(.+\)$/.test(l.title))).toBe(true);
  });
});
