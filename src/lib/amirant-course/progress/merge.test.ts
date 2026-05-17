import { describe, expect, it } from "vitest";
import { AMIRANT_PREPARATION_COURSE_ID } from "../constants";
import { mergeAmirantProgressStates } from "./merge";
import type { AmirantProgressStateV1 } from "./types";

function state(lessons: AmirantProgressStateV1["lessons"]): AmirantProgressStateV1 {
  return { version: 1, courseId: AMIRANT_PREPARATION_COURSE_ID, lessons };
}

describe("mergeAmirantProgressStates", () => {
  it("prefers local completion when remote is incomplete", () => {
    const local = state({
      "lesson.a": { startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-02T00:00:00.000Z" },
    });
    const remote = state({
      "lesson.a": { startedAt: "2026-01-01T00:00:00.000Z" },
    });
    const { merged, lessonsToUpload } = mergeAmirantProgressStates(local, remote);
    expect(merged.lessons["lesson.a"]?.completedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(lessonsToUpload).toContain("lesson.a");
  });

  it("adds local-only lessons", () => {
    const local = state({
      "lesson.b": { startedAt: "2026-02-01T00:00:00.000Z" },
    });
    const remote = state({});
    const { merged, lessonsToUpload } = mergeAmirantProgressStates(local, remote);
    expect(merged.lessons["lesson.b"]?.startedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(lessonsToUpload).toEqual(["lesson.b"]);
  });
});
