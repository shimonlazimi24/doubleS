import { describe, expect, it } from "vitest";
import { AMIRANT_PREPARATION_MANIFEST } from "../manifest";
import { groupModuleLessons, splitLessonTitle } from "./module-lesson-groups";

describe("splitLessonTitle", () => {
  it("separates a level label from the name", () => {
    expect(splitLessonTitle("מבחן תרגול 3 (קל-בינוני)")).toEqual({ name: "מבחן תרגול 3", level: "קל-בינוני" });
    expect(splitLessonTitle("קטע קריאה 10 (הקשה ביותר)")).toEqual({ name: "קטע קריאה 10", level: "הקשה ביותר" });
  });

  it("drops source document numbers and keeps other parentheses", () => {
    expect(splitLessonTitle("קריאה - שיטות (6.2)")).toEqual({ name: "קריאה - שיטות", level: null });
    expect(splitLessonTitle("לוגיסטיקה (יחידה 9)")).toEqual({ name: "לוגיסטיקה", level: null });
    expect(splitLessonTitle("4.3 - מלכודות נפוצות")).toEqual({ name: "מלכודות נפוצות", level: null });
    expect(splitLessonTitle("תצורת מילים (Word Formation)")).toEqual({ name: "תצורת מילים (Word Formation)", level: null });
  });
});

describe("groupModuleLessons", () => {
  it("covers every lesson of every module exactly once, in manifest order", () => {
    for (const mod of AMIRANT_PREPARATION_MANIFEST.modules) {
      const grouped = groupModuleLessons(mod).flatMap((g) => g.lessons.map((l) => l.id));
      expect(new Set(grouped).size, mod.id).toBe(mod.lessons.length);
      expect(grouped.every((id) => mod.lessons.some((l) => l.id === id)), mod.id).toBe(true);
    }
  });

  it("puts the owner's practice units after the method lessons, with units 11+ as a review round", () => {
    const sc = AMIRANT_PREPARATION_MANIFEST.modules.find((m) => m.id === "mod-sc")!;
    const groups = groupModuleLessons(sc);
    expect(groups.map((g) => g.key)).toEqual(["guide", "practice", "review"]);
    expect(groups[1].lessons).toHaveLength(10);
    expect(groups[2].lessons.map((l) => l.id)).toEqual([
      "lesson.sc.test-11",
      "lesson.sc.test-12",
      "lesson.sc.test-13",
      "lesson.sc.test-14",
    ]);
  });
});
