import type { ManifestLesson, ManifestModule } from "../types/course-manifest";

/**
 * How a module's lessons are presented on the course page and in the lesson
 * syllabus: the method lessons first, then the practice units grouped the way
 * a learner works through them. Grouping is by lesson id, which is stable;
 * titles are only displayed.
 */

export const LEVEL_LABELS = ["קל", "קל-בינוני", "בינוני", "בינוני-קשה", "קשה", "קשה מאוד", "הקשה ביותר"] as const;

export type LessonTitleParts = {
  /** The title without a trailing parenthesis that only carried a level or a document number. */
  name: string;
  /** The level label when the title ended with one, e.g. "קשה מאוד". */
  level: string | null;
};

/**
 * "מבחן תרגול 3 (קל-בינוני)" → { name: "מבחן תרגול 3", level: "קל-בינוני" }.
 * "קריאה - שיטות (6.2)" → { name: "קריאה - שיטות", level: null }: the source
 * document's unit number is not information for a learner.
 */
export function splitLessonTitle(title: string): LessonTitleParts {
  // "4.3 - מלכודות נפוצות": the leading unit number is the source document's, not the learner's.
  const stripped = title.replace(/^\d+(\.\d+)?\s*[-–·]\s*/, "");
  const m = stripped.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!m) return { name: stripped.trim(), level: null };
  const inner = m[2].trim();
  if ((LEVEL_LABELS as readonly string[]).includes(inner)) return { name: m[1].trim(), level: inner };
  if (/^\d+(\.\d+)?$/.test(inner) || /^יחידה\s+\d+$/.test(inner)) return { name: m[1].trim(), level: null };
  return { name: stripped.trim(), level: null };
}

/**
 * The name as a list inside its module shows it: the vocabulary lessons all
 * start with "אוצר מילים · ", which is the module's name, not the lesson's.
 */
export function lessonNameInModule(title: string): string {
  return splitLessonTitle(title).name.replace(/^אוצר מילים\s*[·\-–]\s*/, "");
}

export type LessonGroup = {
  key: string;
  title: string;
  lessons: ManifestLesson[];
};

const PRACTICE_UNIT = /^lesson\.(sc\.test|rephrase\.set|reading\.passage|listening\.test|writing\.task|reform\.wf)-(\d+)$/;

function practiceGroupKey(lesson: ManifestLesson): string | null {
  const m = lesson.id.match(PRACTICE_UNIT);
  if (!m) return lesson.id.startsWith("lesson.sim.") ? "sims" : null;
  const kind = m[1];
  const n = Number(m[2]);
  if (kind === "sc.test" || kind === "rephrase.set") return n > 10 ? "review" : "practice";
  if (kind === "reading.passage") return "passages";
  if (kind === "listening.test") return "listening";
  if (kind === "writing.task") return "writing";
  return "wf";
}

const GROUP_TITLES: Record<string, string> = {
  practice: "תרגול לפי רמה",
  review: "סבב חזרה",
  passages: "קטעי תרגול לפי רמה",
  listening: "מבחני האזנה",
  wf: "מבחני יצירת מילה",
  writing: "מטלות כתיבה",
  sims: "סימולציות",
};

/** Groups in display order; a module with only method lessons gets one group named "שיעורים". */
export function groupModuleLessons(mod: ManifestModule): LessonGroup[] {
  const guide: ManifestLesson[] = [];
  const byKey = new Map<string, ManifestLesson[]>();
  for (const lesson of mod.lessons) {
    const key = practiceGroupKey(lesson);
    if (!key) {
      guide.push(lesson);
      continue;
    }
    byKey.set(key, [...(byKey.get(key) ?? []), lesson]);
  }
  const groups: LessonGroup[] = [];
  if (guide.length) groups.push({ key: "guide", title: byKey.size ? "השיטה" : "שיעורים", lessons: guide });
  for (const key of ["practice", "review", "passages", "listening", "wf", "writing", "sims"]) {
    const lessons = byKey.get(key);
    if (lessons?.length) groups.push({ key, title: GROUP_TITLES[key], lessons });
  }
  return groups;
}

export function sumMinutes(lessons: ManifestLesson[]): number {
  return lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0);
}
