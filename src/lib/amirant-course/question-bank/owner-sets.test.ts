import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, AMIRANT_GENERAL_BANK_QUESTIONS, getBankQuestionsByTag } from "./index";
import {
  AMIRANT_BANK_QUESTIONS_PUBLIC,
  AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC,
  AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC,
} from "./client-bank";
import { isOwnerIndexTag, isOwnerSetQuestion } from "./reserved-tags";
import { LESSON_QUESTION_GROUPS } from "../lesson-content/lesson-question-groups";
import { AMIRNET_SYNC_LESSON_REGISTRY } from "../amirnet-content-sync";

/**
 * The content owner's sets are graded, timed units. These tests pin the three
 * promises the import makes about them: each set is reachable from exactly one
 * lesson, no other quiz can draw its questions first, and the owner's private
 * index never reaches the browser.
 */

const ownerRs = AMIRANT_BANK_QUESTIONS.filter((q) => q.tags?.includes("owner_rs"));

describe("owner restatement sets", () => {
  it("are in the bank: 14 sets of 4", () => {
    expect(ownerRs).toHaveLength(56);
    for (let set = 1; set <= 14; set++) {
      expect(getBankQuestionsByTag(`owner-rs-set-${set}`), `set ${set}`).toHaveLength(4);
    }
  });

  it("each set is wired to one lesson that exists, in order", () => {
    for (let set = 1; set <= 14; set++) {
      const lessonId = `lesson.rephrase.set-${String(set).padStart(2, "0")}`;
      expect(LESSON_QUESTION_GROUPS[lessonId]?.tag, lessonId).toBe(`owner-rs-set-${set}`);
      const rel = AMIRNET_SYNC_LESSON_REGISTRY[lessonId]?.amirnetMarkdownRel;
      expect(rel, `${lessonId} has no markdown`).toBeTruthy();
      expect(fs.existsSync(path.join(process.cwd(), "content/amirnet-course", rel!)), rel).toBe(true);
    }
  });

  it("never get easier as the sets go on", () => {
    const mean = (set: number) => {
      const qs = getBankQuestionsByTag(`owner-rs-set-${set}`);
      return qs.reduce((s, q) => s + q.difficulty, 0) / qs.length;
    };
    for (let set = 2; set <= 14; set++) {
      expect(mean(set), `set ${set} vs ${set - 1}`).toBeGreaterThanOrEqual(mean(set - 1));
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

describe("owner sets are reserved for their own lesson", () => {
  it("are not in the general pool (adaptive quizzes, weak-topics quiz, free placement test)", () => {
    expect(AMIRANT_GENERAL_BANK_QUESTIONS.filter((q) => isOwnerSetQuestion(q.tags))).toEqual([]);
    expect(AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC.filter((q) => isOwnerSetQuestion(q.tags))).toEqual([]);
  });

  it("are not in the pool the interactive simulation draws from", () => {
    expect(AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC.filter((q) => isOwnerSetQuestion(q.tags))).toEqual([]);
    // …while the simulation keeps everything else, including its own items.
    expect(AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC.length).toBe(AMIRANT_BANK_QUESTIONS_PUBLIC.length - ownerRs.length);
    expect(AMIRANT_SIMULATION_BANK_QUESTIONS_PUBLIC.some((q) => q.tags?.includes("simulation"))).toBe(true);
  });

  it("leave the general restatement pool as it was", () => {
    const general = AMIRANT_GENERAL_BANK_QUESTIONS.filter((q) => q.topicSlug === "rephrasing");
    expect(general.length).toBeGreaterThanOrEqual(100);
  });
});

describe("the owner's private index stays on the server", () => {
  it("is kept in the full bank", () => {
    expect(ownerRs.every((q) => q.tags?.some((t) => t.startsWith("method:")))).toBe(true);
  });

  it("is absent from the bank that ships to the browser", () => {
    const leaked = AMIRANT_BANK_QUESTIONS_PUBLIC.flatMap((q) => (q.tags ?? []).filter(isOwnerIndexTag));
    expect(leaked).toEqual([]);
  });

  it("is absent from the generated public file itself", () => {
    const file = path.join(process.cwd(), "content/amirant-import/source/questions.public.json");
    const rows = JSON.parse(fs.readFileSync(file, "utf8")) as { tags?: string[] }[];
    expect(rows.flatMap((q) => (q.tags ?? []).filter(isOwnerIndexTag))).toEqual([]);
  });
});
