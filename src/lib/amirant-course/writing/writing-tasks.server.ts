/**
 * The content owner's writing tasks and the info sheet, from the owner JSON
 * that `scripts/writing/parse-writing-docs.mjs` produces.
 *
 * Server only: the lesson page passes one task to the browser as props, and
 * the grading route reads the rubric and the reference essays from here.
 */
import tasksJson from "../../../../content/amirant-import/owner/writing-tasks.json";
import guideJson from "../../../../content/amirant-import/owner/writing-guide.json";
import type { WritingGuidePublic, WritingTaskPublic } from "./types";

type GuideJson = {
  exam: { notesHe: string[] };
  highLevelChecklistHe: string[];
  plan: { notesHe: string[] };
  commonErrors: { rows: { insteadOf: string; write: string; noteHe: string }[] };
  finalCheckHe: string[];
};

// The JSON's inferred type is a union of 14 literal shapes; the parser validated it.
const TASKS = tasksJson as unknown as WritingTaskPublic[];
const GUIDE = guideJson as unknown as GuideJson;
const BY_ID = new Map(TASKS.map((t) => [t.id, t]));

export const WRITING_TASK_COUNT = TASKS.length;

export function getWritingTask(id: string): WritingTaskPublic | undefined {
  return BY_ID.get(id);
}

export function listWritingTasks(): WritingTaskPublic[] {
  return [...TASKS];
}

export function getWritingGuide(): WritingGuidePublic {
  return {
    planHe: GUIDE.plan.notesHe,
    checklistHe: GUIDE.highLevelChecklistHe,
    finalCheckHe: GUIDE.finalCheckHe,
    commonErrors: GUIDE.commonErrors.rows,
  };
}
