import { describe, expect, it } from "vitest";
import { AMIRANT_BANK_QUESTIONS, AMIRANT_GENERAL_BANK_QUESTIONS, getBankQuestionsByTag } from "./index";
import {
  clientQuestionSetFor,
  clientQuestionSetForIds,
  generalPoolForClient,
  simulationPoolForClient,
} from "./for-client.server";
import { isOwnerSetQuestion, isReservedForItsUnit } from "./reserved-tags";
import { mayReadQuestion } from "../question-access";

/**
 * The browser no longer holds a bank. What it gets is what a page serialises
 * here, or what the questions API returns — so these are the rows to keep
 * honest: no answers, no owner index, and the pools drawn by the same rule as
 * the server bank (`reserved-tags.ts`).
 */

describe("clientQuestionSetFor", () => {
  it("carries no answer keys, explanations or tags", () => {
    const set = clientQuestionSetFor(AMIRANT_BANK_QUESTIONS.slice(0, 50));
    for (const q of set.questions) {
      expect(q).not.toHaveProperty("correctOptionId");
      expect(q).not.toHaveProperty("explanation");
      expect(q).not.toHaveProperty("tags");
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.options.length).toBeGreaterThan(1);
    }
  });

  it("keeps the ids in the order asked and drops unknown ones", () => {
    const ids = AMIRANT_BANK_QUESTIONS.slice(0, 5).map((q) => q.id);
    const set = clientQuestionSetForIds([ids[3]!, "no-such-question", ids[0]!]);
    expect(set.questions.map((q) => q.id)).toEqual([ids[3], ids[0]]);
  });

  it("attaches each referenced passage once", () => {
    const rc = AMIRANT_BANK_QUESTIONS.filter((q) => q.topicSlug === "reading_comprehension").slice(0, 12);
    const set = clientQuestionSetFor(rc);
    const wanted = new Set(rc.map((q) => q.passageId).filter(Boolean));
    expect(new Set(set.passages.map((p) => p.id))).toEqual(wanted);
    expect(set.passages.length).toBe(wanted.size);
    for (const p of set.passages) expect(p.bodyMarkdown.length).toBeGreaterThan(0);
  });

  it("serialises an owner set with its passage, for the lesson that owns it", () => {
    const set = clientQuestionSetFor(getBankQuestionsByTag("owner-rc-passage-1"));
    expect(set.questions.length).toBeGreaterThan(0);
    expect(set.passages).toHaveLength(1);
  });
});

describe("pools handed to the browser", () => {
  it("general: same ids in the same order as the server's general bank, no text", () => {
    const pool = generalPoolForClient();
    expect(pool.map((q) => q.id)).toEqual(AMIRANT_GENERAL_BANK_QUESTIONS.map((q) => q.id));
    for (const q of pool) {
      expect(q).not.toHaveProperty("prompt");
      expect(q).not.toHaveProperty("options");
    }
  });

  it("simulation: everything but the owner's sets", () => {
    const ids = new Set(simulationPoolForClient().map((q) => q.id));
    for (const q of AMIRANT_BANK_QUESTIONS) {
      expect(ids.has(q.id), q.id).toBe(!isOwnerSetQuestion(q.tags));
    }
  });
});

describe("mayReadQuestion", () => {
  const reserved = AMIRANT_BANK_QUESTIONS.filter((q) => isReservedForItsUnit(q.tags));
  const general = AMIRANT_GENERAL_BANK_QUESTIONS;

  it("lets anyone read the general bank", () => {
    for (const q of general.slice(0, 20)) expect(mayReadQuestion({ tags: q.tags, hasFullAccess: false })).toBe(true);
  });

  it("keeps the simulations and the owner's sets for full access", () => {
    expect(reserved.length).toBeGreaterThan(0);
    for (const q of reserved) {
      expect(mayReadQuestion({ tags: q.tags, hasFullAccess: false }), q.id).toBe(false);
      expect(mayReadQuestion({ tags: q.tags, hasFullAccess: true }), q.id).toBe(true);
    }
  });
});
