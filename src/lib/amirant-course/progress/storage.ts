import { AMIRANT_PREPARATION_COURSE_ID, LS_PROGRESS } from "../constants";
import { defaultAmirantProgressState, type AmirantProgressStateV1 } from "./types";
import { parseAmirantProgressState, safeParse } from "./parse";

export function loadAmirantProgressState(): AmirantProgressStateV1 {
  if (typeof window === "undefined") {
    return defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
  }
  try {
    const raw = window.localStorage.getItem(LS_PROGRESS);
    if (!raw) return defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
    return parseAmirantProgressState(safeParse(raw));
  } catch {
    return defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
  }
}

export function saveAmirantProgressState(state: AmirantProgressStateV1): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_PROGRESS, JSON.stringify(state));
}

export function markLessonStartedState(prev: AmirantProgressStateV1, lessonId: string, at = new Date().toISOString()): AmirantProgressStateV1 {
  const cur = prev.lessons[lessonId];
  if (cur?.completedAt) return prev;
  if (cur?.startedAt) return prev;
  return {
    ...prev,
    lessons: { ...prev.lessons, [lessonId]: { startedAt: at } },
  };
}

export function markLessonCompletedState(prev: AmirantProgressStateV1, lessonId: string, at = new Date().toISOString()): AmirantProgressStateV1 {
  if (prev.lessons[lessonId]?.completedAt) return prev;
  const cur = prev.lessons[lessonId] ?? { startedAt: at };
  return {
    ...prev,
    lessons: {
      ...prev.lessons,
      [lessonId]: { startedAt: cur.startedAt ?? at, completedAt: at },
    },
  };
}
