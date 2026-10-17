import { describe, expect, it } from "vitest";
import { decideGradeAccess, FREE_BATCH_MAX_ANSWERS, freeBatchShapeError } from "./grade-access";
import { getBankQuestion, AMIRANT_BANK_QUESTIONS } from "./question-bank";
import { isOwnerSetQuestion } from "./question-bank/reserved-tags";

const general = { kind: "bank", tags: ["sc-quiz-2-easy"] } as const;
const ownerSet = { kind: "bank", tags: ["owner_rs", "owner-rs-set-1"] } as const;
const ownerSc = { kind: "bank", tags: ["owner_sc"] } as const;
const simulation = { kind: "bank", tags: ["simulation", "simulation-1-baseline"] } as const;
const untagged = { kind: "bank", tags: undefined } as const;
const demo = { kind: "demo" } as const;

const FULL = { grade: true, reveal: true };
const GRADE_ONLY = { grade: true, reveal: false };
const DENY = { grade: false, reveal: false };

describe("decideGradeAccess", () => {
  it("full access grades and reveals every bank question in both modes", () => {
    for (const source of [general, ownerSet, ownerSc, simulation, untagged]) {
      expect(decideGradeAccess({ source, mode: "batch", hasFullAccess: true })).toEqual(FULL);
      expect(decideGradeAccess({ source, mode: "check", hasFullAccess: true })).toEqual(FULL);
    }
  });

  it("demo questions grade and reveal for everyone", () => {
    expect(decideGradeAccess({ source: demo, mode: "batch", hasFullAccess: false })).toEqual(FULL);
    expect(decideGradeAccess({ source: demo, mode: "check", hasFullAccess: false })).toEqual(FULL);
  });

  it("free placement batch on the general bank: right/wrong, no answer or explanation", () => {
    expect(decideGradeAccess({ source: general, mode: "batch", hasFullAccess: false })).toEqual(GRADE_ONLY);
    expect(decideGradeAccess({ source: untagged, mode: "batch", hasFullAccess: false })).toEqual(GRADE_ONLY);
  });

  it("check is not a free oracle on bank questions", () => {
    expect(decideGradeAccess({ source: general, mode: "check", hasFullAccess: false })).toEqual(DENY);
  });

  it("owner sets and simulations are refused outright without access", () => {
    for (const source of [ownerSet, ownerSc, simulation]) {
      expect(decideGradeAccess({ source, mode: "batch", hasFullAccess: false })).toEqual(DENY);
      expect(decideGradeAccess({ source, mode: "check", hasFullAccess: false })).toEqual(DENY);
    }
  });

  it("unknown ids pass through (nothing to protect; the route answers 404 or isCorrect:false)", () => {
    expect(decideGradeAccess({ source: { kind: "unknown" }, mode: "check", hasFullAccess: false })).toEqual(FULL);
  });

  it("every owner-set question in the real bank is refused to a free caller", () => {
    const owned = AMIRANT_BANK_QUESTIONS.filter((q) => isOwnerSetQuestion(q.tags));
    expect(owned.length).toBeGreaterThan(0);
    for (const q of owned) {
      const row = getBankQuestion(q.id);
      expect(decideGradeAccess({ source: { kind: "bank", tags: row?.tags }, mode: "batch", hasFullAccess: false })).toEqual(
        DENY,
      );
    }
  });
});

describe("freeBatchShapeError", () => {
  it("accepts a placement-sized batch of distinct ids", () => {
    expect(freeBatchShapeError(Array.from({ length: 15 }, (_, i) => `q${i}`))).toBeNull();
  });

  it("rejects the same question twice (all options in one call)", () => {
    expect(freeBatchShapeError(["q1", "q2", "q1"])).toBe("duplicate");
  });

  it("rejects batches larger than any free form", () => {
    expect(freeBatchShapeError(Array.from({ length: FREE_BATCH_MAX_ANSWERS + 1 }, (_, i) => `q${i}`))).toBe(
      "too_many",
    );
  });
});
