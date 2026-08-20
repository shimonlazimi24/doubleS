import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { attachAnswersToQuestions } from "./attach-answers-to-questions";

const SAMPLE = `# 📝 מבחן תרגול #1

### Questions:

**Q1.** What is the main topic?
(A) Alpha
(B) Beta
(C) Gamma
(D) Delta

**Q2.** What does the speaker recommend?
(A) One
(B) Two
(C) Three
(D) Four

## ✅ פתרונות מבחן #1

### Q1: **B** - Beta
כי הדובר מתמקד בבטא לאורך כל הקטע.

### Q2: **C** - Three
הדובר ממליץ במפורש על שלוש.
`;

describe("attachAnswersToQuestions", () => {
  it("moves each answer directly under its question", () => {
    const out = attachAnswersToQuestions(SAMPLE);
    const q1 = out.indexOf("**Q1.**");
    const a1 = out.indexOf("כי הדובר מתמקד");
    const q2 = out.indexOf("**Q2.**");
    const a2 = out.indexOf("הדובר ממליץ במפורש");

    expect(q1).toBeLessThan(a1);
    expect(a1).toBeLessThan(q2);
    expect(q2).toBeLessThan(a2);
  });

  it("keeps the answer below the full option set, never between options", () => {
    const out = attachAnswersToQuestions(SAMPLE);
    const optionD = out.indexOf("(D) Delta");
    const answer = out.indexOf("**B** - Beta");
    expect(optionD).toBeLessThan(answer);
  });

  it("drops the emptied solutions heading", () => {
    const out = attachAnswersToQuestions(SAMPLE);
    expect(out).not.toContain("פתרונות מבחן");
  });

  it("never carries an answer across a test boundary", () => {
    const twoTests = `${SAMPLE}
# 📝 מבחן תרגול #2

**Q1.** Second test question?
(A) Yes
(B) No
(C) Maybe
(D) Never

## ✅ פתרונות מבחן #2

### Q1: **D** - Never
נימוק של המבחן השני.
`;
    const out = attachAnswersToQuestions(twoTests);
    const firstTest = out.slice(0, out.indexOf("מבחן תרגול #2"));
    expect(firstTest).toContain("**B** - Beta");
    expect(firstTest).not.toContain("נימוק של המבחן השני");
  });

  it("leaves markdown without a solutions section untouched", () => {
    const plain = "# כותרת\n\nפסקה רגילה בלי שאלות.\n";
    expect(attachAnswersToQuestions(plain)).toBe(plain);
  });

  it("keeps an answer that has no matching question instead of dropping it", () => {
    const orphan = `# מבחן

**Q1.** Only question?
(A) a
(B) b

## ✅ פתרונות

### Q1: **A** - a
נימוק.

### Q7: **C** - c
נימוק ליתום.
`;
    const out = attachAnswersToQuestions(orphan);
    expect(out).toContain("נימוק ליתום");
  });

  it("pairs every question in the real listening unit", () => {
    const rel = "07_new_reform_audio_writing/7.3_listening_practice_quizzes.md";
    const raw = fs.readFileSync(path.join("content/amirnet-course", rel), "utf8");
    const out = attachAnswersToQuestions(raw);

    // No "### Qn:" answer heading should survive — every one was carried up to
    // its question. The unit's own title ("3 מבחנים מלאים + פתרונות מפורטים")
    // legitimately mentions פתרונות and must stay.
    expect(out).not.toMatch(/^\s*#{2,6}\s*Q\s*\d+\s*[:.]/m);
    expect(out).toContain("3 מבחנים מלאים + פתרונות מפורטים");

    // Every question keeps its answer within a short distance now.
    const lines = out.split("\n");
    const questionIdx = lines
      .map((l, i) => (/^\s*\*\*Q\s*\d+/.test(l) ? i : -1))
      .filter((i) => i >= 0);
    expect(questionIdx.length).toBeGreaterThan(20);

    let paired = 0;
    for (const i of questionIdx) {
      const window = lines.slice(i, i + 14).join("\n");
      if (/\*\*[A-D]\*\*/.test(window)) paired += 1;
    }
    expect(paired / questionIdx.length).toBeGreaterThan(0.9);
  });
});
