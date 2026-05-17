/**
 * Bridges lesson UI (coach / quick check) to the floating chat panel. Dispatched on `window`.
 * Chat uses existing `/api/prep/amirant-course/ai/lesson-chat` with `lessonId` + RAG; prompts must say not to invent exam facts.
 */
export const AMIRANT_COURSE_COACH_EVENT = "amirant:course:coach-prompt" as const;

export type AmirantCourseCoachEventDetail = {
  userMessage: string;
  /** If true, submit immediately after the panel processes the input (and opens if needed). */
  autoSend?: boolean;
};

export function dispatchAmirantCourseCoach(detail: AmirantCourseCoachEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AMIRANT_COURSE_COACH_EVENT, { detail }));
}
