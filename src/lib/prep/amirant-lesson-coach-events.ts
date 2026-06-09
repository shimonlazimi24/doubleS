/**
 * Bridges lesson/quiz UI to the floating chat panel. Dispatched on `window`.
 */
export const AMIRANT_COURSE_COACH_EVENT = "amirant:course:coach-prompt" as const;
export const AMIRANT_COURSE_QUESTION_CONTEXT_EVENT = "amirant:course:question-context" as const;

export type AmirantCourseCoachEventDetail = {
  userMessage: string;
  autoSend?: boolean;
};

/** Fired whenever the active question changes in a quiz/simulation */
export type AmirantQuestionContextDetail = {
  questionText: string;
  topic?: string;
  questionType?: string;
  lessonId?: string;
};

export function dispatchAmirantCourseCoach(detail: AmirantCourseCoachEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AMIRANT_COURSE_COACH_EVENT, { detail }));
}

export function dispatchAmirantQuestionContext(detail: AmirantQuestionContextDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AMIRANT_COURSE_QUESTION_CONTEXT_EVENT, { detail }));
}
