import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMIRNET_CONTENT_MODULES, AMIRNET_SYNC_LESSON_REGISTRY } from "../amirnet-content-sync";
import { WRITING_LESSONS } from "../lesson-content/lesson-question-groups";
import { groupModuleLessons } from "../lesson-content/module-lesson-groups";
import { countWords, type WritingTaskPublic } from "./types";
import { getWritingGuide, getWritingTask, WRITING_TASK_COUNT } from "./writing-tasks.server";

const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
const tasks: WritingTaskPublic[] = read("content/amirant-import/owner/writing-tasks.json");
// Pictographs (surrogate pairs) and the dingbat block, written without the `u` flag for the TS target.
const EMOJI = /[\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-➿]/;

describe("owner writing package (parsed JSON)", () => {
  it("is 14 tasks with 42 reference essays, three levels each", () => {
    expect(tasks).toHaveLength(14);
    expect(tasks.flatMap((t) => t.samples)).toHaveLength(42);
    for (const t of tasks) {
      expect(t.samples.map((s) => s.level).sort()).toEqual(["high", "low", "mid"]);
      expect(t.prompt.length).toBeGreaterThan(40);
      expect(t.wordRange).toEqual([90, 120]);
      expect(t.minutes).toBe(12);
    }
  });

  it("every reference essay has the word count the document states (±3) and a Hebrew analysis", () => {
    for (const t of tasks) {
      for (const s of t.samples) {
        const wc = countWords(s.essay);
        expect(Math.abs(wc - s.statedWords), `${t.id} ${s.level}: ${wc} vs ${s.statedWords}`).toBeLessThanOrEqual(3);
        expect(s.analysisHe).toMatch(/[֐-׿]/);
        expect(s.analysisEn).toMatch(/^[A-Za-z]/);
      }
    }
  });

  it("every rubric cell is filled and reads as a level description", () => {
    for (const t of tasks) {
      for (const dim of ["content", "language"] as const) {
        for (const level of ["low", "mid", "high"] as const) {
          expect(t.rubric[dim][level].length, `${t.id} ${dim}.${level}`).toBeGreaterThan(30);
        }
      }
      expect(t.method.length).toBeGreaterThanOrEqual(2);
      expect(t.usefulPhrases.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("the guide has the checklist, the plan, the common errors and the final check", () => {
    const g = getWritingGuide();
    expect(g.checklistHe).toHaveLength(10);
    expect(g.planHe.length).toBeGreaterThanOrEqual(3);
    expect(g.commonErrors).toHaveLength(8);
    expect(g.finalCheckHe).toHaveLength(6);
    for (const row of g.commonErrors) expect(row.write).not.toBe(row.insteadOf);
  });

  it("nothing the learner sees carries an emoji", () => {
    const g = getWritingGuide();
    const texts = [
      ...tasks.flatMap((t) => [t.prompt, ...t.method.map((m) => m.titleHe + m.bodyHe), ...t.usefulPhrases, ...t.samples.map((s) => s.analysisHe)]),
      ...g.checklistHe,
      ...g.planHe,
      ...g.finalCheckHe,
    ];
    for (const s of texts) expect(s, s.slice(0, 40)).not.toMatch(EMOJI);
  });
});

describe("writing lessons in the course", () => {
  it("fourteen lessons, each mapped to an existing task, grouped as מטלות כתיבה in the reform module", () => {
    expect(WRITING_TASK_COUNT).toBe(14);
    expect(Object.keys(WRITING_LESSONS)).toHaveLength(14);
    for (const [lessonId, { taskId, timeLimitSec }] of Object.entries(WRITING_LESSONS)) {
      expect(getWritingTask(taskId), lessonId).toBeTruthy();
      expect(timeLimitSec).toBe(12 * 60);
      expect(AMIRNET_SYNC_LESSON_REGISTRY[lessonId], `${lessonId} registry`).toBeTruthy();
    }
    const reform = AMIRNET_CONTENT_MODULES.find((m) => m.id === "mod-reform")!;
    const group = groupModuleLessons(reform).find((g) => g.key === "writing");
    expect(group?.title).toBe("מטלות כתיבה");
    expect(group?.lessons.map((l) => l.id)).toEqual(Object.keys(WRITING_LESSONS));
    expect(reform.lessons.some((l) => l.id === "lesson.reform.09")).toBe(false);
  });
});
