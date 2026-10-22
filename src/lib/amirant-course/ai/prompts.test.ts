import { describe, expect, it } from "vitest";
import { examFactsPromptBlock, lessonChatPrompt, lessonChatSystemPrompt } from "./prompts";
import { EXAM_SCORED_MINUTES, EXAM_SCORED_QUESTION_COUNT, EXAM_FACTS_VERIFICATION } from "../exam-facts";

describe("lessonChatSystemPrompt", () => {
  const sys = lessonChatSystemPrompt();

  it("tells the model to answer in Hebrew and explain the English", () => {
    expect(sys).toMatch(/Answer in Hebrew/);
    expect(sys).toMatch(/quote the exact words/i);
  });

  it("carries the exam facts derived from exam-facts.ts, with the unconfirmed caveat", () => {
    expect(sys).toContain(`${EXAM_SCORED_QUESTION_COUNT} questions in ${EXAM_SCORED_MINUTES} minutes`);
    if (!EXAM_FACTS_VERIFICATION.confirmedAgainstOfficialSource) {
      expect(sys).toMatch(/NOT yet confirmed/);
    }
    expect(sys).toMatch(/Registration dates, prices.*NOT in this list/);
  });

  it("states the answer-key, lesson-citation, clarifying-question and no-filler rules", () => {
    expect(sys).toMatch(/Timed unit \+ not answered yet: never say or imply/);
    expect(sys).toMatch(/מתוך שיעור «/);
    expect(sys).toMatch(/ask ONE short clarifying question/);
    expect(sys).toMatch(/no 'בהחלט'/);
  });

  it("includes one worked example per scored question type", () => {
    expect(sys).toMatch(/Example 1 - sentence completion/);
    expect(sys).toMatch(/Example 2 - restatement/);
    expect(sys).toMatch(/Example 3 - reading comprehension/);
  });
});

describe("examFactsPromptBlock", () => {
  it("lists every scored segment", () => {
    const block = examFactsPromptBlock();
    expect(block).toMatch(/השלמת משפטים · חלק א׳ - 4 שאלות, 4 דק׳/);
    expect(block).toMatch(/הבנת הנקרא - 5 שאלות, 15 דק׳/);
    expect(block).toMatch(/Score scale 50-150/);
  });
});

describe("lessonChatPrompt", () => {
  const base = {
    userMessage: "למה התשובה היא ב?",
    lessonId: "lesson.sc.intro",
    lessonTitle: "השלמת משפטים: מבוא",
    moduleTitle: "השלמת משפטים",
    contextBlocks: ["[chunk:abc|sim:0.400|lesson:«השלמת משפטים: מבוא»] text"],
    learnerProfileText: "weak topics in last quiz: ניסוח מחדש; last quiz 60% (6/10).",
  };

  it("includes lesson title, module, learner profile, step text and label", () => {
    const p = lessonChatPrompt({
      ...base,
      activeContext: { kind: "lesson_step", text: "The committee rejected the proposal.", stepLabel: "דוגמה" },
    });
    expect(p).toContain("Lesson: «השלמת משפטים: מבוא» (module «השלמת משפטים»)");
    expect(p).toContain("Learner: weak topics in last quiz: ניסוח מחדש");
    expect(p).toContain("lesson step «דוגמה»");
    expect(p).toContain("The committee rejected the proposal.");
    expect(p).toContain("[1] [chunk:abc");
  });

  it("sends the question text and all options for a quiz question", () => {
    const p = lessonChatPrompt({
      ...base,
      activeContext: {
        kind: "quiz_question",
        text: "The committee ____ the proposal.",
        questionType: "sentence_completion",
        options: [
          { id: "a", label: "rejected" },
          { id: "b", label: "rejecting" },
        ],
        timed: true,
        answered: false,
      },
    });
    expect(p).toContain("(a) rejected");
    expect(p).toContain("(b) rejecting");
    expect(p).toContain("type: sentence_completion");
  });

  it("withholds the key for a timed, unanswered question and says so explicitly", () => {
    const p = lessonChatPrompt({
      ...base,
      activeContext: {
        kind: "quiz_question",
        text: "Q",
        options: [{ id: "a", label: "x" }],
        timed: true,
        answered: false,
      },
    });
    expect(p).toContain("Answer key: WITHHELD");
    expect(p).not.toMatch(/correct option = /);
  });

  it("includes the key and the learner's choice once the learner has answered", () => {
    const p = lessonChatPrompt({
      ...base,
      activeContext: {
        kind: "quiz_question",
        text: "Q",
        options: [{ id: "a", label: "x" }, { id: "c", label: "y" }],
        timed: true,
        answered: true,
        selectedOptionId: "a",
        answerKey: { correctOptionId: "c", explanation: "because" },
      },
    });
    expect(p).toContain("learner already answered (chose a)");
    expect(p).toContain("correct option = (c)");
    expect(p).toContain("Explanation from the bank: because");
  });

  it("includes the passage for reading questions", () => {
    const p = lessonChatPrompt({
      ...base,
      activeContext: { kind: "quiz_question", text: "Main idea?", passageText: "Long passage text here.", timed: true },
    });
    expect(p).toMatch(/Passage:\n"""\nLong passage text here\.\n"""/);
  });

  it("falls back to the legacy plain text and tells the model to ask which question when nothing is on screen", () => {
    expect(lessonChatPrompt({ ...base, activeQuestionText: "legacy text" })).toContain('ON SCREEN NOW:\n"""\nlegacy text\n"""');
    expect(lessonChatPrompt({ ...base, lessonId: undefined })).toContain("ask which one");
    expect(lessonChatPrompt({ ...base, lessonId: undefined })).toContain("Scope: course-wide");
  });

  it("keeps the conversation history in order", () => {
    const p = lessonChatPrompt({
      ...base,
      history: [
        { role: "user", text: "first" },
        { role: "assistant", text: "reply" },
      ],
    });
    expect(p.indexOf("Learner: first")).toBeLessThan(p.indexOf("Assistant: reply"));
    expect(p.indexOf("Assistant: reply")).toBeLessThan(p.indexOf("Learner's message:"));
  });

  it("says when no context was retrieved", () => {
    expect(lessonChatPrompt({ ...base, contextBlocks: [] })).toContain("Course context: none retrieved");
  });
});
