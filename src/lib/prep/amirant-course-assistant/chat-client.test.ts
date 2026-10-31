import { describe, expect, it } from "vitest";
import {
  buildActiveContextPayload,
  buildHistoryPayload,
  finalAnswerText,
  httpErrorToHebrew,
  isContextualCoursePath,
  lessonIdFromPath,
  nextHintSession,
  parseSseLine,
  questionKey,
  remainingCounter,
  truncateStem,
} from "./chat-client";

describe("buildHistoryPayload", () => {
  it("keeps the last 8 non-empty turns, each cut to 600 chars", () => {
    const msgs = Array.from({ length: 11 }, (_, i) => ({
      id: String(i),
      role: i % 2 ? ("assistant" as const) : ("user" as const),
      text: i === 5 ? "   " : "x".repeat(700) + String(i),
    }));
    const h = buildHistoryPayload(msgs);
    expect(h).toHaveLength(8);
    expect(h.every((t) => t.text.length === 600)).toBe(true);
    expect(h[0]!.role).toBe("user"); // index 2 after dropping 0, 1 and the blank 5
  });
});

describe("buildActiveContextPayload", () => {
  it("infers the kind from options and never carries a key", () => {
    const p = buildActiveContextPayload({
      questionText: "Q",
      options: [{ id: "a", label: "x" }],
      questionId: "q1",
      timed: true,
      answered: false,
    });
    expect(p.kind).toBe("quiz_question");
    expect(p.questionId).toBe("q1");
    expect(Object.keys(p)).not.toContain("correctOptionId");
    expect(buildActiveContextPayload({ questionText: "T" }).kind).toBe("lesson_step");
  });
});

describe("parseSseLine", () => {
  it("parses the four event kinds and ignores noise", () => {
    expect(parseSseLine('data: {"t":"ack"}')).toEqual({ t: "ack" });
    expect(parseSseLine('data: {"t":"tok","v":"ש"}')).toEqual({ t: "tok", v: "ש" });
    expect(parseSseLine('data: {"t":"done","d":{"answer":"a"}}')).toEqual({ t: "done", d: { answer: "a" } });
    expect(parseSseLine('data: {"t":"err","e":"x"}')).toEqual({ t: "err", e: "x" });
    expect(parseSseLine("event: ping")).toBeNull();
    expect(parseSseLine("data: {not json")).toBeNull();
  });
});

describe("finalAnswerText", () => {
  it("appends the cautious-mode note and the recommendation", () => {
    expect(finalAnswerText({ answer: "A", safeFallback: true, recommendedAction: "R" })).toBe(
      "A\n\n(מצב זהיר - מידע מוגבל/חסר.)\n\n**המלצה:** R",
    );
    expect(finalAnswerText({ answer: "A", safeFallback: false, recommendedAction: null })).toBe("A");
  });
});

describe("nextHintSession", () => {
  it("advances after stages 1 and 2, ends after stage 3 and after a reveal", () => {
    expect(nextHintSession({ hintStage: 1, nextHintAvailable: true, questionType: "rephrasing" })).toEqual({
      stage: 2,
      questionType: "rephrasing",
    });
    expect(nextHintSession({ hintStage: 2, nextHintAvailable: true })).toEqual({ stage: 3, questionType: undefined });
    expect(nextHintSession({ hintStage: 3, nextHintAvailable: false })).toBeNull();
    expect(nextHintSession({ hintStage: 4, nextHintAvailable: false })).toBeNull();
    expect(nextHintSession({ hintStage: null, nextHintAvailable: false })).toBeNull();
  });
});

describe("truncateStem", () => {
  it("collapses whitespace and cuts on a word", () => {
    const s = truncateStem("Maria loves animals,\n so she   decided to adopt a puppy from the shelter today.", 40);
    expect(s).toBe("Maria loves animals, so she decided to…");
    expect(truncateStem("short")).toBe("short");
  });
});

describe("questionKey", () => {
  it("prefers the bank id and falls back to the text", () => {
    expect(questionKey({ questionText: "T", questionId: "q1" })).toBe("q1");
    expect(questionKey({ questionText: "T", kind: "lesson_step" })).toBe("lesson_step:T");
    expect(questionKey(null)).toBeNull();
  });
});

describe("paths", () => {
  it("knows the contextual pages and the lesson id", () => {
    expect(isContextualCoursePath("/prep/amirant/course/lesson/lesson.sc.intro")).toBe(true);
    expect(isContextualCoursePath("/prep/amirant/course/simulation")).toBe(true);
    expect(isContextualCoursePath("/prep/amirant/course/dashboard")).toBe(false);
    expect(lessonIdFromPath("/prep/amirant/course/lesson/lesson.sc.intro?x=1")).toBe("lesson.sc.intro");
    expect(lessonIdFromPath("/prep/amirant/course/quiz")).toBeNull();
  });
});

describe("httpErrorToHebrew", () => {
  it("passes the route's Hebrew copy through and maps transport failures", () => {
    const he = "העוזר האישי זמין למנויי הקורס.";
    expect(httpErrorToHebrew(403, { error: he })).toBe(he);
    expect(httpErrorToHebrew(429, { error: "Rate limit exceeded" })).toBe("יותר מדי בקשות כרגע. המתינו רגע ונסו שוב.");
    expect(httpErrorToHebrew(400, { error: "Invalid body" })).toBe("הבקשה לא תקינה. נסחו מחדש ונסו שוב.");
    expect(httpErrorToHebrew(502, "<html>")).toBe("השירות לא זמין כרגע. נסו שוב בעוד רגע.");
  });
});

describe("remainingCounter", () => {
  it("is silent until 1200 characters, then counts down to 0", () => {
    expect(remainingCounter(10)).toBeNull();
    expect(remainingCounter(1199)).toBeNull();
    expect(remainingCounter(1200)).toBe(300);
    expect(remainingCounter(1500)).toBe(0);
  });
});
