import { describe, expect, it } from "vitest";
import {
  bandForScore,
  bonusForAccuracy,
  experimentalPlan,
  finalLevel,
  pickItem,
  rng,
  scoredPlan,
  scoreForLevel,
  stepAfterAnswer,
  stepAfterClip,
  stepAfterReadingSet,
  type PoolIndexItem,
  type PoolRules,
} from "./engine";

const rules: PoolRules = {
  startLevel: 4,
  sectionTimes: [
    { type: "sentence_completion", questions: 4, minutes: 4, core_sections: [1, 2, 6] },
    { type: "reading_set", questions: 5, minutes: 15, core_sections: [3] },
    { type: "restatement", questions: 3, minutes: 6, core_sections: [4, 5] },
    { type: "listening_lecture", questions: 5, minutes: 7 },
    { type: "word_formation", questions: 4, minutes: 3 },
    { type: "writing_task", questions: 1, minutes: 12 },
  ],
  scoreAnchors: [[0.5, 50], [1.5, 70], [2.5, 85], [3.5, 100], [4.5, 120], [5.5, 134], [6.5, 150]],
  bands: [[50, 69, "טרום בסיסי א'"], [70, 84, "טרום בסיסי ב'"], [85, 99, "בסיסי"], [100, 119, "מתקדמים א'"], [120, 133, "מתקדמים ב'"], [134, 150, "פטור"]],
  experimentalBonus: [[0.8, 2], [0.6, 1]],
};

describe("adaptive simulation engine", () => {
  it("lays out the exam's six scored sections in the exam's order", () => {
    const plan = scoredPlan(rules);
    expect(plan.map((p) => p.type)).toEqual(["sentence_completion", "sentence_completion", "reading_set", "restatement", "restatement", "sentence_completion"]);
    expect(plan.map((p) => p.seconds)).toEqual([240, 240, 900, 360, 360, 240]);
    expect(plan.reduce((s, p) => s + p.questionCount, 0)).toBe(23);
  });

  it("chooses the experimental part deterministically per seed: two sections or one writing task", () => {
    const all = new Set(["sentence_completion", "reading_set", "restatement", "listening_lecture", "word_formation", "writing_task"] as const);
    const a = experimentalPlan(rules, all, 1);
    expect(experimentalPlan(rules, all, 1)).toEqual(a);
    const kinds = new Set<string>();
    for (let s = 0; s < 60; s++) kinds.add(experimentalPlan(rules, all, s).map((p) => p.type).join("+"));
    expect(kinds.has("writing_task")).toBe(true);
    const list = Array.from(kinds);
    expect(list.some((k) => k.includes("listening_lecture+word_formation") || k.includes("word_formation+listening_lecture"))).toBe(true);
    for (const k of list) expect(k === "writing_task" || k.split("+").length === 2).toBe(true);
  });

  it("steps one level per answer, bounded 1–6; sets step by their own rules", () => {
    expect(stepAfterAnswer(4, true)).toBe(5);
    expect(stepAfterAnswer(4, false)).toBe(3);
    expect(stepAfterAnswer(6, true)).toBe(6);
    expect(stepAfterAnswer(1, false)).toBe(1);
    expect(stepAfterReadingSet(3, 5)).toBe(4);
    expect(stepAfterReadingSet(3, 3)).toBe(3);
    expect(stepAfterReadingSet(3, 2)).toBe(2);
    expect(stepAfterClip(4, 2, 2)).toBe(5);
    expect(stepAfterClip(4, 1, 2)).toBe(4);
    expect(stepAfterClip(4, 0, 2)).toBe(3);
  });

  it("picks unseen items at the level, the nearest level when it is empty, and skips related items", () => {
    const index: PoolIndexItem[] = [
      { id: "a4", type: "sentence_completion", level: 4, b: 4 },
      { id: "b5", type: "sentence_completion", level: 5, b: 5 },
      { id: "c3", type: "sentence_completion", level: 3, b: 3, related: "r" },
      { id: "r", type: "restatement", level: 3, b: 3, related: "c3" },
    ];
    const random = rng(7);
    const first = pickItem({ index, type: "sentence_completion", level: 4, used: new Set(), usedRelated: new Set(), preferUp: true, random });
    expect(first?.item.id).toBe("a4");
    expect(first?.substituted).toBe(false);
    const second = pickItem({ index, type: "sentence_completion", level: 4, used: new Set(["a4"]), usedRelated: new Set(), preferUp: true, random });
    expect(second?.item.id).toBe("b5");
    expect(second?.substituted).toBe(true);
    const down = pickItem({ index, type: "sentence_completion", level: 4, used: new Set(["a4"]), usedRelated: new Set(), preferUp: false, random });
    expect(down?.item.id).toBe("c3");
    const blocked = pickItem({ index, type: "sentence_completion", level: 3, used: new Set(["a4", "b5"]), usedRelated: new Set(["c3"]), preferUp: false, random });
    expect(blocked).toBeNull();
  });

  it("maps the final level to the 50–150 scale through the anchors", () => {
    expect(scoreForLevel(0.5, rules.scoreAnchors)).toBe(50);
    expect(scoreForLevel(6.5, rules.scoreAnchors)).toBe(150);
    expect(scoreForLevel(4, rules.scoreAnchors)).toBe(110);
    expect(scoreForLevel(5.5, rules.scoreAnchors)).toBe(134);
    expect(bandForScore(134, rules.bands)).toBe("פטור");
    expect(bandForScore(99, rules.bands)).toBe("בסיסי");
  });

  it("final level is the nudged mean of the last six scored answers", () => {
    const events = [1, 2, 3, 4, 5, 6, 5, 6].map((level, i) => ({ level, correct: i % 2 === 0 }));
    // last six: 3+,4-,5+,6-,5+,6-  → (3.5+3.5+5.5+5.5+5.5+5.5)/6
    expect(finalLevel(events)).toBeCloseTo(29 / 6, 5);
    expect(finalLevel([])).toBe(0.5);
  });

  it("gives the experimental bonus by accuracy", () => {
    expect(bonusForAccuracy(0.9, rules.experimentalBonus)).toBe(2);
    expect(bonusForAccuracy(0.6, rules.experimentalBonus)).toBe(1);
    expect(bonusForAccuracy(0.5, rules.experimentalBonus)).toBe(0);
    expect(bonusForAccuracy(null, rules.experimentalBonus)).toBe(0);
  });
});
