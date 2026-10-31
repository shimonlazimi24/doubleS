import { describe, expect, it } from "vitest";
import { classifyChatIntent, resolveStagedStage } from "./intent-classifier";
import { amirantChatbotRequestSchema, type AmirantChatIntent } from "./schemas";

function req(userMessage: string, extra: Record<string, unknown> = {}) {
  return amirantChatbotRequestSchema.parse({ userMessage, ...extra });
}

/**
 * The questions learners actually type, and where each one must land. A wrong
 * intent is not cosmetic: staged_hint truncates the answer to one clue, logistics
 * forbids general knowledge, reveal_answer is blocked on a timed unit.
 */
const FIXTURES: Array<{ msg: string; intent: AmirantChatIntent; action?: string }> = [
  { msg: "תן לי רמז", intent: "staged_hint" },
  { msg: "רמז נוסף", intent: "staged_hint" },
  { msg: "מה התשובה הנכונה?", intent: "reveal_answer" },
  { msg: "גלה תשובה", intent: "reveal_answer" },
  { msg: "what is the correct answer?", intent: "reveal_answer" },
  { msg: "למה התשובה היא ב?", intent: "question_help" },
  { msg: "איך ניגשים לשאלות השלמת משפטים?", intent: "question_help" },
  { msg: "מה הרעיון המרכזי של הפסקה השנייה?", intent: "question_help" },
  { msg: "How do I approach reading comprehension questions?", intent: "question_help" },
  { msg: "בדוק מילה: reluctant", intent: "vocabulary_lookup" },
  { msg: "נתח את הביצועים שלי", intent: "performance_analysis" },
  { msg: "מה כדאי לי לעשות עכשיו?", intent: "recommendation" },
  { msg: "כמה עולה המבחן?", intent: "logistics" },
  { msg: "מתי המבחן הבא ואיך נרשמים?", intent: "logistics" },
  { msg: "לא הבנתי", intent: "general_course_help" },
  { msg: "תודה", intent: "general_course_help" },
];

describe("classifyChatIntent fixtures", () => {
  for (const f of FIXTURES) {
    it(`"${f.msg}" -> ${f.intent}`, () => {
      expect(classifyChatIntent(req(f.msg, f.action ? { clientAction: f.action } : {})).intent).toBe(f.intent);
    });
  }

  it("the explicit button wins over the text", () => {
    expect(classifyChatIntent(req("בדיקת מילה: focus", { clientAction: "vocab_lookup", vocabularyWord: "focus" })).intent).toBe(
      "vocabulary_lookup",
    );
    expect(classifyChatIntent(req("תן לי רמז", { clientAction: "reveal" })).intent).toBe("reveal_answer");
  });

  it("a long pasted question with options is question help, not logistics", () => {
    const msg =
      "The committee ____ the proposal after a long debate. א. rejected ב. rejecting ג. rejection ד. rejects - איך פותרים?";
    expect(classifyChatIntent(req(msg)).intent).toBe("question_help");
  });
});

describe("resolveStagedStage", () => {
  it("next_hint without a client stage starts at 2", () => {
    const r = req("רמז נוסף", { clientAction: "next_hint" });
    expect(resolveStagedStage(r, "staged_hint")).toEqual({ stage: 2, isNext: true });
  });

  it("client stage is authoritative", () => {
    const r = req("רמז נוסף", { clientAction: "next_hint", stagedHintContext: { stage: 3 } });
    expect(resolveStagedStage(r, "staged_hint").stage).toBe(3);
  });

  it("reveal is stage 4", () => {
    expect(resolveStagedStage(req("גלה תשובה"), "reveal_answer").stage).toBe(4);
  });
});
