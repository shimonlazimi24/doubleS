/**
 * Calibration: the grader must place the owner's 42 reference essays at their
 * stated levels, on both dimensions, at least 80% of the time. Costs about a
 * dollar, so it runs only when asked:
 *
 *   OPENAI_API_KEY=… RUN_WRITING_CALIBRATION=1 npx vitest run src/lib/amirant-course/writing/grade-essay.calibration.test.ts
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { gradeEssay } from "./grade-essay.server";
import { listWritingTasks } from "./writing-tasks.server";

// vitest does not read .env.local; take the key from there when the shell did not export it.
if (!process.env.OPENAI_API_KEY) {
  try {
    const line = fs
      .readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
      .split("\n")
      .find((l) => l.startsWith("OPENAI_API_KEY="));
    if (line) process.env.OPENAI_API_KEY = line.slice("OPENAI_API_KEY=".length).trim();
  } catch {
    /* no local env file */
  }
}

const enabled = process.env.RUN_WRITING_CALIBRATION === "1" && Boolean(process.env.OPENAI_API_KEY);

describe.skipIf(!enabled)("writing grader calibration against the 42 reference essays", () => {
  it("matches the stated level on both dimensions for at least 80% of samples", async () => {
    const tasks = listWritingTasks();
    const rows: { task: number; level: string; content: string; language: string }[] = [];
    for (const t of tasks) {
      for (const s of t.samples) {
        const r = await gradeEssay(t, s.essay);
        rows.push({ task: t.n, level: s.level, content: r.content.level, language: r.language.level });
      }
    }
    const contentHits = rows.filter((r) => r.content === r.level).length;
    const languageHits = rows.filter((r) => r.language === r.level).length;
    const both = rows.filter((r) => r.content === r.level && r.language === r.level).length;
    const misses = rows.filter((r) => r.content !== r.level || r.language !== r.level);
    // eslint-disable-next-line no-console
    console.log(
      `calibration: content ${contentHits}/${rows.length}, language ${languageHits}/${rows.length}, both ${both}/${rows.length}\n` +
        misses.map((m) => `  task ${m.task} ${m.level}: content=${m.content} language=${m.language}`).join("\n"),
    );
    expect(contentHits / rows.length).toBeGreaterThanOrEqual(0.8);
    expect(languageHits / rows.length).toBeGreaterThanOrEqual(0.8);
  }, 42 * 30_000);
});
