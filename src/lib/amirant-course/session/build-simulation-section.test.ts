import { describe, expect, it } from "vitest";
import { buildSimulationSectionQuestionIds } from "./build-simulation-section";
import {
  AMIRANT_BANK_QUESTIONS_PUBLIC,
  bankQuestionsPublicToPoolItems,
  getPublicBankQuestion,
} from "../question-bank/client-bank";
import { AMIRANT_SIMULATIONS } from "../simulations/definitions";
import {
  EXAM_SCORED_MINUTES,
  EXAM_SCORED_QUESTION_COUNT,
  EXAM_SCORED_SEGMENTS,
} from "../exam-facts";

const POOL = bankQuestionsPublicToPoolItems(AMIRANT_BANK_QUESTIONS_PUBLIC);

describe("simulation blueprint", () => {
  it("mirrors the published exam structure", () => {
    for (const sim of AMIRANT_SIMULATIONS) {
      const questions = sim.sections.reduce((sum, s) => sum + s.questionCount, 0);
      const minutes = sim.sections.reduce((sum, s) => sum + s.seconds / 60, 0);
      expect(questions).toBe(EXAM_SCORED_QUESTION_COUNT);
      expect(minutes).toBe(EXAM_SCORED_MINUTES);
      expect(sim.sections.map((s) => s.topicSlug)).toEqual(
        EXAM_SCORED_SEGMENTS.map((s) => s.type),
      );
    }
  });

  it("includes restatement under timed conditions", () => {
    for (const sim of AMIRANT_SIMULATIONS) {
      const rephrasing = sim.sections.filter((s) => s.topicSlug === "rephrasing");
      expect(rephrasing.length).toBeGreaterThan(0);
      expect(rephrasing.reduce((sum, s) => sum + s.questionCount, 0)).toBe(6);
    }
  });

  it("never spends a reading passage on the unscored pilot", () => {
    for (const sim of AMIRANT_SIMULATIONS) {
      expect(sim.pilot.topicSlug).not.toBe("reading_comprehension");
    }
  });
});

describe("buildSimulationSectionQuestionIds", () => {
  it("anchors a reading section to one passage", () => {
    const ids = buildSimulationSectionQuestionIds({
      pool: POOL,
      bank: AMIRANT_BANK_QUESTIONS_PUBLIC,
      topicSlug: "reading_comprehension",
      targetLevel: 3,
      count: 5,
      excludeIds: [],
      tieBreakSalt: "test:s2",
    });

    expect(ids).toHaveLength(5);
    const passageIds = Array.from(
      new Set(ids.map((id) => getPublicBankQuestion(id)?.passageId)),
    );
    expect(passageIds).toHaveLength(1);
    expect(passageIds[0]).toBeTruthy();
  });

  it("prefers a passage the learner has not seen", () => {
    const first = buildSimulationSectionQuestionIds({
      pool: POOL,
      bank: AMIRANT_BANK_QUESTIONS_PUBLIC,
      topicSlug: "reading_comprehension",
      targetLevel: 3,
      count: 5,
      excludeIds: [],
      tieBreakSalt: "test:s2",
    });
    const second = buildSimulationSectionQuestionIds({
      pool: POOL,
      bank: AMIRANT_BANK_QUESTIONS_PUBLIC,
      topicSlug: "reading_comprehension",
      targetLevel: 3,
      count: 5,
      excludeIds: first,
      tieBreakSalt: "test:s2",
    });

    expect(second).toHaveLength(5);
    expect(getPublicBankQuestion(second[0]!)?.passageId).not.toBe(
      getPublicBankQuestion(first[0]!)?.passageId,
    );
  });

  it("supplies a distinct passage to each of the six simulations", () => {
    const used = new Set<string>();
    const seenQuestionIds: string[] = [];
    for (const sim of AMIRANT_SIMULATIONS) {
      const ids = buildSimulationSectionQuestionIds({
        pool: POOL,
        bank: AMIRANT_BANK_QUESTIONS_PUBLIC,
        topicSlug: "reading_comprehension",
        targetLevel: 3,
        count: 5,
        excludeIds: seenQuestionIds,
        tieBreakSalt: `${sim.id}:s2`,
      });
      seenQuestionIds.push(...ids);
      const passageId = getPublicBankQuestion(ids[0]!)?.passageId;
      expect(passageId).toBeTruthy();
      used.add(passageId!);
    }
    expect(used.size).toBe(AMIRANT_SIMULATIONS.length);
  });

  it("delegates non-reading sections to the adaptive picker", () => {
    const ids = buildSimulationSectionQuestionIds({
      pool: POOL,
      bank: AMIRANT_BANK_QUESTIONS_PUBLIC,
      topicSlug: "rephrasing",
      targetLevel: 4,
      count: 3,
      excludeIds: [],
      tieBreakSalt: "test:s3",
    });

    expect(ids).toHaveLength(3);
    for (const id of ids) {
      expect(getPublicBankQuestion(id)?.topicSlug).toBe("rephrasing");
    }
  });
});
