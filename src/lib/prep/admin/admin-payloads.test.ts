import { describe, expect, it } from "vitest";
import { bodyToSave } from "./lesson-body";
import { parseLessonPayload } from "./lesson-payload";
import { parseQuestionId, parseQuestionPayload } from "./question-payload";

const known = {
  lessonIds: new Set(["lesson.vocab.01"]),
  moduleIds: new Set(["mod-vocab"]),
};

const lesson = {
  title: "  מילים שכיחות  ",
  kind: "text",
  module_id: "mod-vocab",
  body_markdown: "# כותרת",
  video_url: "",
  estimated_minutes: 12,
  sort_order: 3,
  published: true,
};

describe("parseLessonPayload", () => {
  it("accepts a course lesson and normalises the row", () => {
    const r = parseLessonPayload("lesson.vocab.01", lesson, known);
    expect(r).toEqual({
      ok: true,
      row: {
        id: "lesson.vocab.01",
        title: "מילים שכיחות",
        kind: "text",
        module_id: "mod-vocab",
        body_markdown: "# כותרת",
        video_url: null,
        estimated_minutes: 12,
        sort_order: 3,
        published: true,
      },
    });
  });

  it("refuses ids the course does not render (they would 404 for every learner)", () => {
    const r = parseLessonPayload("lesson.made-up", lesson, known);
    expect(r.ok).toBe(false);
  });

  it("refuses a module that does not exist", () => {
    const r = parseLessonPayload("lesson.vocab.01", { ...lesson, module_id: "vocabulary" }, known);
    expect(r).toEqual({ ok: false, error: "המודול שנבחר לא קיים בקורס" });
  });

  it("requires a video for video lessons and https for the link", () => {
    expect(parseLessonPayload("lesson.vocab.01", { ...lesson, kind: "video" }, known).ok).toBe(false);
    const http = parseLessonPayload("lesson.vocab.01", { ...lesson, kind: "mixed", video_url: "http://x.y" }, known);
    expect(http).toEqual({ ok: false, error: "קישור הסרטון חייב להתחיל ב-https://" });
  });

  it("answers in Hebrew for a missing title or a bad duration", () => {
    expect(parseLessonPayload("lesson.vocab.01", { ...lesson, title: " " }, known)).toEqual({
      ok: false,
      error: "חסרה כותרת לשיעור",
    });
    const neg = parseLessonPayload("lesson.vocab.01", { ...lesson, estimated_minutes: 0 }, known);
    expect(neg).toEqual({ ok: false, error: "זמן משוער: לפחות דקה" });
  });

  it("fills defaults for omitted optional fields", () => {
    const r = parseLessonPayload("lesson.vocab.01", { title: "x" }, known);
    expect(r.ok && r.row).toMatchObject({ kind: "text", estimated_minutes: 10, sort_order: 0, published: false, module_id: null });
  });
});

describe("bodyToSave", () => {
  it("saves untouched course text as empty, so later file fixes still reach learners", () => {
    expect(bodyToSave("# a\n\nb\n", "# a\n\nb")).toBe("");
  });
  it("keeps a real edit", () => {
    expect(bodyToSave("# a\n\nc", "# a\n\nb")).toBe("# a\n\nc");
  });
  it("keeps the text when the lesson has no course markdown", () => {
    expect(bodyToSave("new", "")).toBe("new");
  });
});

describe("parseQuestionPayload", () => {
  const q = {
    topic_slug: "vocabulary",
    prompt: "Pick one",
    options: [
      { id: "a", text: "1" },
      { id: "b", text: "2" },
      { id: "c", text: "3" },
      { id: "d", text: "4" },
    ],
    correct_option_id: "c",
    difficulty: 2,
  };

  it("accepts a complete question", () => {
    const r = parseQuestionPayload(q);
    expect(r.ok && r.row).toMatchObject({ topic_slug: "vocabulary", correct_option_id: "c", difficulty: 2, published: false });
  });

  it("refuses a correct answer that is not one of the options", () => {
    expect(parseQuestionPayload({ ...q, correct_option_id: "e" })).toEqual({
      ok: false,
      error: "התשובה הנכונה לא נמצאת בין התשובות",
    });
  });

  it("refuses an empty option and difficulty outside 1-6", () => {
    const empty = { ...q, options: q.options.map((o, i) => (i === 1 ? { ...o, text: " " } : o)) };
    expect(parseQuestionPayload(empty).ok).toBe(false);
    expect(parseQuestionPayload({ ...q, difficulty: 7 })).toEqual({ ok: false, error: "רמת קושי בין 1 ל-6" });
  });

  it("only allows URL-safe ids", () => {
    expect(parseQuestionId("q.vocab.101")).toBe("q.vocab.101");
    expect(parseQuestionId("../x")).toBeNull();
    expect(parseQuestionId("שאלה")).toBeNull();
  });
});
