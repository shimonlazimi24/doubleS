import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, AMIRANT_GENERAL_BANK_QUESTIONS, getBankQuestionsByTag } from "./index";
import {
  AMIRANT_BANK_QUESTIONS_PUBLIC,
  AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC,
  AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC,
  getClientPassage,
} from "./client-bank";
import { isOwnerIndexTag, isOwnerSetQuestion } from "./reserved-tags";
import { LESSON_QUESTION_GROUPS } from "../lesson-content/lesson-question-groups";
import { AMIRNET_SYNC_LESSON_REGISTRY, AMIRNET_CONTENT_MODULES } from "../amirnet-content-sync";

/**
 * The content owner's sets are graded, timed units. These tests pin what the
 * imports promise about them: each unit is reachable from exactly one lesson,
 * the lesson title tells the truth about its level, no other quiz can draw
 * its questions first, and the owner's private index never reaches the browser.
 */

type Unit = { tag: string; prefix: string; lessonPrefix: string; count: number; perUnit: number[] };
const UNITS: Record<string, Unit> = {
  sentence_completion: { tag: "owner_sc", prefix: "owner-sc-test-", lessonPrefix: "lesson.sc.test-", count: 14, perUnit: [8] },
  rephrasing: { tag: "owner_rs", prefix: "owner-rs-set-", lessonPrefix: "lesson.rephrase.set-", count: 14, perUnit: [4] },
  reading_comprehension: { tag: "owner_rc", prefix: "owner-rc-passage-", lessonPrefix: "lesson.reading.passage-", count: 10, perUnit: [5, 6] },
};

const pad = (n: number) => String(n).padStart(2, "0");
const titleOf = (lessonId: string) =>
  AMIRNET_CONTENT_MODULES.flatMap((m) => m.lessons).find((l) => l.id === lessonId)?.title;

/** Same scale the lesson titles were written with; "L6 top" counts 6.5. */
function levelLabel(questions: { difficulty: number; tags?: string[] }[]): string {
  const mean = questions.reduce((s, q) => s + (q.tags?.includes("l6-top") ? 6.5 : q.difficulty), 0) / questions.length;
  const scale: [number, string][] = [[2.5, "קל"], [3.5, "קל-בינוני"], [4.25, "בינוני"], [5, "בינוני-קשה"], [5.75, "קשה"], [6.2, "קשה מאוד"]];
  return scale.find(([lim]) => mean < lim)?.[1] ?? "הקשה ביותר";
}

describe.each(Object.entries(UNITS))("owner %s units", (topic, u) => {
  const own = AMIRANT_BANK_QUESTIONS.filter((q) => q.tags?.includes(u.tag));

  it(`are in the bank: ${u.count} units`, () => {
    expect(own.every((q) => q.topicSlug === topic)).toBe(true);
    for (let n = 1; n <= u.count; n++) {
      expect(u.perUnit, `unit ${n}`).toContain(getBankQuestionsByTag(`${u.prefix}${n}`).length);
    }
    expect(getBankQuestionsByTag(`${u.prefix}${u.count + 1}`)).toHaveLength(0);
  });

  it("each unit has one lesson, with its markdown on disk and a title that states its level", () => {
    for (let n = 1; n <= u.count; n++) {
      const lessonId = `${u.lessonPrefix}${pad(n)}`;
      expect(LESSON_QUESTION_GROUPS[lessonId]?.tag, lessonId).toBe(`${u.prefix}${n}`);
      const rel = AMIRNET_SYNC_LESSON_REGISTRY[lessonId]?.amirnetMarkdownRel;
      expect(rel, `${lessonId} has no markdown`).toBeTruthy();
      expect(fs.existsSync(path.join(process.cwd(), "content/amirnet-course", rel!)), rel).toBe(true);
      // A re-rated index must not leave a lesson called "hardest" over easier questions.
      expect(titleOf(lessonId), lessonId).toContain(`(${levelLabel(getBankQuestionsByTag(`${u.prefix}${n}`))})`);
    }
  });

  it("are not in the general pool or the simulation's pool", () => {
    expect(AMIRANT_GENERAL_BANK_QUESTIONS.filter((q) => q.tags?.includes(u.tag))).toEqual([]);
    expect(AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC.filter((q) => q.tags?.includes(u.tag))).toEqual([]);
    expect(AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC.filter((q) => q.tags?.includes(u.tag))).toEqual([]);
  });

  it("keep the owner's index on the server side only", () => {
    expect(own.every((q) => q.tags?.some((t) => t.startsWith("method:")))).toBe(true);
  });
});

describe("owner reading passages", () => {
  it("every question points at a passage the browser can load, and each passage numbers its paragraphs", () => {
    for (const q of AMIRANT_BANK_QUESTIONS.filter((x) => x.tags?.includes("owner_rc"))) {
      const p = getClientPassage(q.passageId ?? "");
      expect(p, `${q.id} → ${q.passageId}`).toBeTruthy();
      // The client strips the blockquote markers; paragraph numbers must survive.
      expect(p!.bodyMarkdown.startsWith("(1) ")).toBe(true);
    }
  });
});

describe("every lesson question group resolves", () => {
  it("has at least one question in the bank", () => {
    for (const [lessonId, group] of Object.entries(LESSON_QUESTION_GROUPS)) {
      expect(getBankQuestionsByTag(group.tag).length, `${lessonId} → ${group.tag}`).toBeGreaterThan(0);
    }
  });
});

describe("the general pools keep what they had", () => {
  it("still has the earlier questions of every topic", () => {
    // Pool sizes before the owner's sets arrived; adding sets must not shrink them.
    const n = (t: string) => AMIRANT_GENERAL_BANK_QUESTIONS.filter((q) => q.topicSlug === t).length;
    expect(n("sentence_completion")).toBeGreaterThanOrEqual(85);
    expect(n("rephrasing")).toBeGreaterThanOrEqual(100);
    expect(n("reading_comprehension")).toBeGreaterThanOrEqual(51);
    expect(AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC.some((q) => q.tags?.includes("simulation"))).toBe(true);
    expect(AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC.filter((q) => isOwnerSetQuestion(q.tags))).toEqual([]);
  });
});

describe("the owner's private index stays on the server", () => {
  it("is absent from the bank that ships to the browser", () => {
    expect(AMIRANT_BANK_QUESTIONS_PUBLIC.flatMap((q) => (q.tags ?? []).filter(isOwnerIndexTag))).toEqual([]);
  });

  it("is absent from the generated public file itself", () => {
    const file = path.join(process.cwd(), "content/amirant-import/source/questions.public.json");
    const rows = JSON.parse(fs.readFileSync(file, "utf8")) as { tags?: string[] }[];
    expect(rows.flatMap((q) => (q.tags ?? []).filter(isOwnerIndexTag))).toEqual([]);
  });
});
