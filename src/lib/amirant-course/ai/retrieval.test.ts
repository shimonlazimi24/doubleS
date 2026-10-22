import { describe, expect, it } from "vitest";
import { isBankTopicSlug, mergeRetrievedChunks, planLessonChatRetrieval, type RetrievedChunk } from "./retrieval";

describe("isBankTopicSlug", () => {
  it("accepts only the four indexed topic values", () => {
    expect(isBankTopicSlug("sentence_completion")).toBe(true);
    expect(isBankTopicSlug("reading_comprehension")).toBe(true);
    // A lesson step label is not a filter - it would match nothing in the index.
    expect(isBankTopicSlug("הסבר")).toBe(false);
    expect(isBankTopicSlug(undefined)).toBe(false);
  });
});

describe("planLessonChatRetrieval", () => {
  it("lesson step: lesson first, then course-wide; never lesson+topic together", () => {
    expect(planLessonChatRetrieval({ lessonId: "lesson.sc.1", topic: "הסבר", activeKind: "lesson_step" })).toEqual([
      { lessonId: "lesson.sc.1" },
      {},
    ]);
  });

  it("quiz question: topic first, then the last lesson, then course-wide", () => {
    expect(
      planLessonChatRetrieval({ lessonId: "lesson.rc.2", topic: "reading_comprehension", activeKind: "quiz_question" }),
    ).toEqual([{ topic: "reading_comprehension" }, { lessonId: "lesson.rc.2" }, {}]);
  });

  it("no context: course-wide only", () => {
    expect(planLessonChatRetrieval({})).toEqual([{}]);
  });

  it("never emits a filter with both lessonId and topic", () => {
    for (const plan of [
      planLessonChatRetrieval({ lessonId: "l", topic: "vocabulary" }),
      planLessonChatRetrieval({ lessonId: "l", topic: "vocabulary", activeKind: "quiz_question" }),
    ]) {
      for (const f of plan) expect(Boolean(f.lessonId && f.topic)).toBe(false);
    }
  });
});

const row = (id: string, similarity = 0.5): RetrievedChunk => ({ id, text: id, similarity });

describe("mergeRetrievedChunks", () => {
  it("keeps plan order, dedupes, and reserves two slots for the course-wide pass", () => {
    const primary = [row("p1"), row("p2"), row("p3"), row("p4"), row("p5"), row("p6")];
    const wide = [row("p1"), row("w1"), row("w2"), row("w3")];
    const out = mergeRetrievedChunks([primary, wide], 6).map((c) => c.id);
    expect(out).toEqual(["p1", "p2", "p3", "p4", "w1", "w2"]);
  });

  it("lets the course-wide pass fill everything when the filtered pass is empty", () => {
    const wide = [row("w1"), row("w2"), row("w3")];
    expect(mergeRetrievedChunks([[], wide], 5).map((c) => c.id)).toEqual(["w1", "w2", "w3"]);
  });

  it("a single pass may use all slots", () => {
    const only = [row("a"), row("b"), row("c")];
    expect(mergeRetrievedChunks([only], 2).map((c) => c.id)).toEqual(["a", "b"]);
  });
});
