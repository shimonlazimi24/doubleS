import { describe, expect, it } from "vitest";
import { splitMarkdownByMasachH1, stripMasachNumberingForDisplay } from "@/lib/amirant-course/content-source/split-markdown-masach";
import { filterBankByTopics, filterBankByTopicsAndVocabMode } from "@/lib/amirant-course/question-bank";
import { extractVocabHebrewTranslation, parseVocabularyMarkdown, vocabularyBodyHasNumberedWordEntries } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";
import { applyStreakLevelTransition, type DifficultyLevel, selectNextQuestion, type QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import { initialInTestLevel, updateInTestLevelAfterAnswer } from "@/lib/amirant-course/adaptive/in-test-level";
import { nextSimulationSectionEnterLevel } from "@/lib/amirant-course/session/section-level";
import { buildAdaptiveQuizQuestionIds } from "@/lib/amirant-course/session/build-adaptive-quiz-question-ids";
import { gradeAdaptiveQuizOutcomes } from "@/lib/amirant-course/session/grade-adaptive-quiz-outcomes";
import { clampDifficultyLevel } from "@/lib/amirant-course/difficulty-clamp";
import { emptyAnalytics, recordQuestionOutcome } from "@/lib/amirant-course";
import type { BankQuestion } from "@/lib/amirant-course/types/bank-question";

describe("applyStreakLevelTransition", () => {
  it("does not level up after a single correct answer", () => {
    const t = applyStreakLevelTransition(
      { currentLevel: 3, correctStreak: 0, wrongStreak: 0 },
      true,
    );
    expect(t.nextLevel).toBe(3);
    expect(t.correctStreak).toBe(1);
  });

  it("does not level down after a single wrong answer", () => {
    const t = applyStreakLevelTransition(
      { currentLevel: 3, correctStreak: 0, wrongStreak: 0 },
      false,
    );
    expect(t.nextLevel).toBe(3);
    expect(t.wrongStreak).toBe(1);
  });

  it("increments level after 2 correct in a row and caps at 6", () => {
    let t = applyStreakLevelTransition({ currentLevel: 5, correctStreak: 0, wrongStreak: 0 }, true);
    expect(t.nextLevel).toBe(5);
    expect(t.correctStreak).toBe(1);
    t = applyStreakLevelTransition({ currentLevel: 5, correctStreak: 1, wrongStreak: 0 }, true);
    expect(t.nextLevel).toBe(6);
    t = applyStreakLevelTransition({ currentLevel: 6, correctStreak: 1, wrongStreak: 0 }, true);
    t = applyStreakLevelTransition(
      { currentLevel: t.nextLevel, correctStreak: t.correctStreak, wrongStreak: t.wrongStreak },
      true,
    );
    expect(t.nextLevel).toBe(6);
  });

  it("decrements level after 2 wrong in a row and floors at 1", () => {
    let t = applyStreakLevelTransition({ currentLevel: 2, correctStreak: 0, wrongStreak: 0 }, false);
    expect(t.nextLevel).toBe(2);
    t = applyStreakLevelTransition({ currentLevel: 2, correctStreak: 0, wrongStreak: 1 }, false);
    expect(t.nextLevel).toBe(1);
    t = applyStreakLevelTransition({ currentLevel: 1, correctStreak: 0, wrongStreak: 1 }, false);
    t = applyStreakLevelTransition(
      { currentLevel: t.nextLevel, correctStreak: t.correctStreak, wrongStreak: t.wrongStreak },
      false,
    );
    expect(t.nextLevel).toBe(1);
  });

  it("resets opposite streaks correctly", () => {
    const c1 = applyStreakLevelTransition(
      { currentLevel: 3, correctStreak: 0, wrongStreak: 0 },
      true,
    );
    expect(c1.correctStreak).toBe(1);
    expect(c1.wrongStreak).toBe(0);

    const w1 = applyStreakLevelTransition(
      {
        currentLevel: c1.nextLevel,
        correctStreak: c1.correctStreak,
        wrongStreak: c1.wrongStreak,
      },
      false,
    );
    expect(w1.correctStreak).toBe(0);
    expect(w1.wrongStreak).toBe(1);
  });
});

describe("in-test level adapter", () => {
  it("aligns with two correct streak to level up", () => {
    let s = initialInTestLevel(3);
    s = updateInTestLevelAfterAnswer(s, true).state;
    s = updateInTestLevelAfterAnswer(s, true).state;
    expect(s.currentLevel).toBe(4);
  });
});

describe("nextSimulationSectionEnterLevel", () => {
  it("moves on strong or weak section accuracy", () => {
    expect(nextSimulationSectionEnterLevel(3, 4, 4)).toBe(4);
    expect(nextSimulationSectionEnterLevel(3, 0, 4)).toBe(2);
    expect(nextSimulationSectionEnterLevel(3, 2, 4)).toBe(3);
  });
});

function miniBank(): { pool: QuestionPoolItem[]; bankById: Map<string, BankQuestion> } {
  const bankById = new Map<string, BankQuestion>();
  const pool: QuestionPoolItem[] = [];
  let n = 0;
  for (const topic of ["vocabulary", "sentence_completion"] as const) {
    for (let d = 1; d <= 6; d++) {
      for (let k = 0; k < 3; k++) {
        n += 1;
        const id = `mini-${n}`;
        const correctOptionId = `${id}-c`;
        const row: BankQuestion = {
          id,
          prompt: id,
          options: [
            { id: correctOptionId, label: "c" },
            { id: `${id}-w1`, label: "w" },
            { id: `${id}-w2`, label: "w" },
            { id: `${id}-w3`, label: "w" },
          ],
          correctOptionId,
          explanation: "e",
          topicSlug: topic,
          subtopicSlug: "s",
          difficulty: d as DifficultyLevel,
        };
        bankById.set(id, row);
        pool.push({ questionId: id, topicId: topic, subtopicId: "s", difficultyLevel: d as DifficultyLevel });
      }
    }
  }
  return { pool, bankById };
}

describe("buildAdaptiveQuizQuestionIds", () => {
  const { pool, bankById } = miniBank();

  it("does not repeat ids in one chain when the pool is sufficient", () => {
    const ids = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs: ["vocabulary", "sentence_completion"],
      questionCount: 12,
      startLevel: 2,
      answers: Array.from({ length: 12 }, () => null),
      tieBreakSalt: "uniq-test",
    });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps 16 distinct ids in one topic even past the 12-question recency window", () => {
    const n = 16;
    const topicSlugs = ["vocabulary"];
    const answers: (string | null)[] = Array.from({ length: n }, () => null);
    for (let i = 0; i < n - 1; i++) {
      const chain = buildAdaptiveQuizQuestionIds({
        pool,
        bankById,
        topicSlugs,
        questionCount: n,
        startLevel: 3,
        answers,
        tieBreakSalt: "session-exclusion",
      });
      const id = chain[i];
      if (!id) throw new Error(`expected id at index ${i}`);
      answers[i] = bankById.get(id)!.correctOptionId;
    }
    const last = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs,
      questionCount: n,
      startLevel: 3,
      answers,
      tieBreakSalt: "session-exclusion",
    });
    expect(last.length).toBe(16);
    expect(new Set(last).size).toBe(16);
  });

  it("rebuilds later picks when cumulative outcomes change the adaptive level", () => {
    const { pool, bankById } = miniBank();
    const step1 = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs: ["vocabulary"],
      questionCount: 8,
      startLevel: 3,
      answers: Array.from({ length: 8 }, () => null),
      tieBreakSalt: "rebuild",
    });
    const r0 = bankById.get(step1[0]!)!;
    const step2 = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs: ["vocabulary"],
      questionCount: 8,
      startLevel: 3,
      answers: [r0.correctOptionId, null, null, null, null, null, null, null],
      tieBreakSalt: "rebuild",
    });
    const r1 = bankById.get(step2[1]!)!;
    const w0 = r0.options.find((o) => o.id !== r0.correctOptionId)!.id;
    const w1 = r1.options.find((o) => o.id !== r1.correctOptionId)!.id;
    const twoWrong = [w0, w1, null, null, null, null, null, null] as (string | null)[];
    const twoRight = [r0.correctOptionId, r1.correctOptionId, null, null, null, null, null, null] as (string | null)[];
    const down = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs: ["vocabulary"],
      questionCount: 8,
      startLevel: 3,
      answers: twoWrong,
      tieBreakSalt: "rebuild",
    });
    const up = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs: ["vocabulary"],
      questionCount: 8,
      startLevel: 3,
      answers: twoRight,
      tieBreakSalt: "rebuild",
    });
    expect(down[2]).toBeDefined();
    expect(up[2]).toBeDefined();
    const downQ = bankById.get(down[2]!)!;
    const upQ = bankById.get(up[2]!)!;
    // Behavior-level assertion: chain replay changes target level, so picked
    // third question should come from a lower/higher difficulty bucket.
    expect(downQ.difficulty).toBeLessThan(upQ.difficulty);
  });

  it("uses fallback when exact level is empty in topic", () => {
    const tiny: QuestionPoolItem[] = [
      { questionId: "only-3", topicId: "x", subtopicId: "s", difficultyLevel: 3 },
    ];
    const b = new Map<string, BankQuestion>([
      [
        "only-3",
        {
          id: "only-3",
          prompt: "p",
          options: [
            { id: "only-3-c", label: "c" },
            { id: "only-3-w1", label: "w" },
            { id: "only-3-w2", label: "w" },
            { id: "only-3-w3", label: "w" },
          ],
          correctOptionId: "only-3-c",
          explanation: "e",
          topicSlug: "vocabulary",
          subtopicSlug: "s",
          difficulty: 3,
        },
      ],
    ]);
    const sel = selectNextQuestion({
      pool: tiny,
      topicId: "x",
      targetLevel: 2,
      recentQuestionIds: [],
      tieBreakSalt: "fb",
    });
    expect(sel?.questionId).toBe("only-3");
    expect(sel?.reason).toMatch(/fallback/);
  });
});

describe("gradeAdaptiveQuizOutcomes", () => {
  const { bankById } = miniBank();
  const fourIds = ["mini-1", "mini-2", "mini-3", "mini-4"] as const;
  const correctAnswers = fourIds.map((id) => bankById.get(id)!.correctOptionId);

  it("aggregates analytics from graded answers", () => {
    const g = gradeAdaptiveQuizOutcomes({
      questionIds: [...fourIds],
      answers: correctAnswers,
      bankById,
      questionCount: 4,
      startLevel: 3,
      currentIndex: 0,
      reason: "manual",
      nowMs: 1e12,
      questionEnteredAtMs: 1e12,
      prevAnalytics: emptyAnalytics(),
      sessionLabel: "t",
    });
    expect(g.correct).toBe(4);
    expect(g.scorePercent).toBe(100);
    expect(g.nextAnalytics.byTopic.vocabulary?.total).toBe(4);
  });
});

describe("clampDifficultyLevel", () => {
  it("clamps to 1–6", () => {
    expect(clampDifficultyLevel(0)).toBe(1);
    expect(clampDifficultyLevel(7)).toBe(6);
    expect(clampDifficultyLevel(3.4)).toBe(3);
  });
});

describe("splitMarkdownByMasachH1", () => {
  it("splits on # … מסמך X.Y and prepends preamble to first section", () => {
    const md = `
# יחידה 1
תיאור
---
# 📘 מסמך 1.1: א
שורה
# 📘 מסמך 1.2: ב
אחר
`;
    const parts = splitMarkdownByMasachH1(md);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("יחידה 1");
    expect(parts[0]).toContain("מסמך 1.1");
    expect(parts[1]).toContain("מסמך 1.2");
    expect(parts[1]).not.toContain("מסמך 1.1");
  });
});

describe("stripMasachNumberingForDisplay", () => {
  it("strips document numbers from H1 while keeping the human title", () => {
    expect(stripMasachNumberingForDisplay("# 📘 מסמך 1.1: שם")).toBe("# שם");
    expect(stripMasachNumberingForDisplay("## מסמך 2.3: תת־נושא")).toBe("## תת־נושא");
  });
  it("does not alter body text with מסמך", () => {
    const p = "המילה מסמך 1.1 בטקסט רגיל";
    expect(stripMasachNumberingForDisplay(p)).toBe(p);
  });
});

describe("filterBankByTopicsAndVocabMode", () => {
  it("filters vocabulary subtopics for verbs only; leaves other topics", () => {
    const v = filterBankByTopicsAndVocabMode(["vocabulary", "sentence_completion"], "verbs");
    const vq = v.filter((q) => q.topicSlug === "vocabulary");
    expect(vq.length).toBeGreaterThan(0);
    expect(vq.every((q) => q.subtopicSlug.startsWith("vocab-verbs-"))).toBe(true);
    const sc = v.filter((q) => q.topicSlug === "sentence_completion");
    expect(sc.length).toBeGreaterThan(0);
  });
  it("mixed matches filterBankByTopics for vocabulary", () => {
    const a = filterBankByTopicsAndVocabMode(["vocabulary"], "mixed");
    const b = filterBankByTopics(["vocabulary"]);
    expect(a).toEqual(b);
  });
});

describe("parseVocabularyMarkdown", () => {
  it("parses ## sections and ### N. word blocks", () => {
    const md = `
# Pack
## Section A
### 1. **be** (v.)
- **תרגום:** להיות
- **Definition:** to exist
## Section B
### 2. **go** (v.)
- **תרגום:** ללכת
`;
    const p = parseVocabularyMarkdown(md);
    expect(vocabularyBodyHasNumberedWordEntries(p)).toBe(true);
    expect(p.allEntries).toHaveLength(2);
    expect(p.allEntries[0].word).toBe("be");
    expect(p.allEntries[0].translation).toBe("להיות");
    expect(p.sections[0].entries[0].n).toBe(1);
  });
  it("extractVocabHebrewTranslation handles **תרגום:**", () => {
    const t = extractVocabHebrewTranslation(`### 1. **x** (v.)\n- **תרגום:** alpha\n`);
    expect(t).toBe("alpha");
  });
});

describe("recordQuestionOutcome rollup", () => {
  it("increments topic and difficulty buckets", () => {
    let a = emptyAnalytics();
    a = recordQuestionOutcome(a, { topicSlug: "vocabulary", difficulty: 2, isCorrect: true });
    a = recordQuestionOutcome(a, { topicSlug: "vocabulary", difficulty: 2, isCorrect: false, timeMs: 1000 });
    expect(a.byTopic.vocabulary?.correct).toBe(1);
    expect(a.byTopic.vocabulary?.total).toBe(2);
    expect(a.byTopic.vocabulary?.byDifficulty[2]?.total).toBe(2);
    expect(a.byTopic.vocabulary?.responseTimeMsSum).toBe(1000);
  });
});
