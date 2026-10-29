import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { AMIRANT_BANK_QUESTIONS, getPassage } from "../../question-bank";
import { isOwnerSetQuestion } from "../../question-bank/reserved-tags";
import { poolIndex, poolMcKey, poolRules, poolWaveIds, poolWordFormationKey } from "./pool.server";
import { answerSingle, startAttempt, submitSet, submitWritingText, timeOut, buildReport } from "./run.server";

const POOL_DIR = path.join(process.cwd(), "content/amirant-import/owner/simulation-pool");

// The owner's final pool (wave 1 plus the additions, one file).
describe("simulation pool", () => {
  const wave = JSON.parse(fs.readFileSync(path.join(POOL_DIR, "POOL.json"), "utf8")) as { items: { type: string; level: number; questions?: unknown[] }[] };

  it("has the owner's counts: 444 items, 648 questions, every level in 1–6", () => {
    expect(wave.items.length).toBe(444);
    const questions = wave.items.reduce((n, it) => n + (it.questions ? it.questions.length : 1), 0);
    expect(questions).toBe(648);
    for (const it of wave.items) expect(it.level >= 1 && it.level <= 6).toBe(true);
    const byType: Record<string, number> = {};
    for (const it of wave.items) byType[it.type] = (byType[it.type] ?? 0) + 1;
    expect(byType).toEqual({ sentence_completion: 188, restatement: 116, reading_set: 43, listening_lecture: 51, word_formation: 36, writing_task: 10 });
  });

  it("is the only wave in the index (wave 1 was retired into it) and loads through the pool module", () => {
    expect(poolWaveIds()).toEqual(["POOL"]);
    expect(poolIndex().length).toBeGreaterThanOrEqual(444);
    expect(poolRules().startLevel).toBe(4);
  });

  it("puts its multiple-choice questions in the bank as the owner's set, never in the general pools", () => {
    const rows = AMIRANT_BANK_QUESTIONS.filter((q) => q.tags?.includes("owner_sim_pool"));
    expect(rows.length).toBe(602);
    for (const q of rows) {
      expect(isOwnerSetQuestion(q.tags)).toBe(true);
      expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
      expect(/[\uD83C-\uD83E][\uDC00-\uDFFF]/.test(q.prompt)).toBe(false);
      if (q.passageId) expect(getPassage(q.passageId)).toBeTruthy();
    }
    const first = rows.find((q) => q.id === "sim-pool-sc-l1-0006")!;
    expect(poolMcKey(first.id)?.correctOptionId).toBe(first.correctOptionId);
  });

  it("serves word-formation keys with every accepted form", () => {
    const key = poolWordFormationKey("sim-pool-wf-l2-0005");
    expect(key?.baseWord).toBe("knife");
    expect(key?.accepted).toContain("knives");
  });
});

describe("one adaptive attempt end to end (no I/O)", () => {
  it("moves the level per answer, never repeats an item, and ends with a report", () => {
    const start = startAttempt({ userKey: "test", simId: "POOL", attemptId: null, priorUsed: [] });
    let state = start.state;
    let section = start.section!;
    const seen = new Set<string>();
    const noteUsed = () => {
      for (const id of state.current.itemIds) {
        expect(seen.has(id)).toBe(false);
      }
    };
    noteUsed();
    // Section 1: wrong, right, right, right → 4 → 3 → 4 → 5 → 6
    const levels: number[] = [state.level];
    for (let i = 0; i < 4; i++) {
      const q = section.questions[0]!;
      const key = poolMcKey(q.questionId)!;
      const pick = i === 0 ? q.options.find((o) => o.id !== key.correctOptionId)!.id : key.correctOptionId;
      const out = answerSingle(state, q.questionId, pick);
      state = out.state;
      levels.push(state.level);
      expect(out.lastCorrect).toBe(i !== 0);
      if (out.section) section = out.section;
    }
    expect(levels).toEqual([4, 3, 4, 5, 6]);
    expect(state.sectionIndex).toBe(1);
    expect(state.results[0]?.levelPath.length).toBe(4);

    // Walk the rest answering everything right, time out one section to exercise it.
    let guard = 0;
    while (!state.finished && guard++ < 60) {
      const plan = state.plan[state.sectionIndex]!;
      if (plan.mode === "single") {
        if (state.sectionIndex === 1 && state.current.answered === 0) {
          const out = timeOut(state, {});
          state = out.state;
          if (out.section) section = out.section;
          continue;
        }
        const q = section.questions[0] ?? null;
        const wf = section.wordFormation[0] ?? null;
        const answer = q ? poolMcKey(q.questionId)!.correctOptionId : poolWordFormationKey(wf!.questionId)!.accepted[0]!;
        const out = answerSingle(state, q ? q.questionId : wf!.questionId, answer);
        state = out.state;
        if (out.section) section = out.section;
      } else if (plan.mode === "set") {
        const answers: Record<string, string> = {};
        for (const q of section.questions) answers[q.questionId] = poolMcKey(q.questionId)!.correctOptionId;
        const out = submitSet(state, answers);
        state = out.state;
        if (out.section) section = out.section;
      } else {
        const out = submitWritingText(state, "");
        state = out.state;
        if (out.section) section = out.section;
      }
    }
    expect(state.finished).toBe(true);
    const ids = state.used;
    expect(new Set(ids).size).toBe(ids.length);
    const report = buildReport(state, null);
    expect(report.sections.length).toBeGreaterThanOrEqual(7);
    expect(report.score).toBeGreaterThanOrEqual(50);
    expect(report.score).toBeLessThanOrEqual(150);
    expect(report.low).toBeLessThanOrEqual(report.score);
    expect(report.sections[1]?.correct).toBe(0);
  });
});
