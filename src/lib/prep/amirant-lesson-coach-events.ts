/**
 * Bridges lesson/quiz UI to the floating chat panel. Dispatched on `window`.
 */
export const AMIRANT_COURSE_COACH_EVENT = "amirant:course:coach-prompt" as const;
export const AMIRANT_COURSE_QUESTION_CONTEXT_EVENT = "amirant:course:question-context" as const;

export type AmirantCourseCoachEventDetail = {
  userMessage: string;
  autoSend?: boolean;
};

export type AmirantQuestionContextKind = "lesson_step" | "quiz_question";

/**
 * Fired whenever the content on screen changes (lesson step, quiz/simulation question).
 * The browser never holds answer keys: for a bank question only `questionId` travels,
 * and the server decides whether the key may be used (see chatbot-router).
 */
export type AmirantQuestionContextDetail = {
  questionText: string;
  /** Bank topic slug (vocabulary / sentence_completion / rephrasing / reading_comprehension) when known. */
  topic?: string;
  questionType?: string;
  lessonId?: string;
  kind?: AmirantQuestionContextKind;
  /** Lesson step label as shown in the workspace ("הסבר", "דוגמה", ...). */
  stepLabel?: string;
  /** Bank question id - lets the server fetch the key once the learner has answered. */
  questionId?: string;
  options?: { id: string; label: string }[];
  /** Reading passage body (plain text) when the question belongs to one. */
  passageText?: string;
  /** Timed unit (adaptive quiz, placement, simulation): no key before the learner answers. */
  timed?: boolean;
  answered?: boolean;
  selectedOptionId?: string | null;
};

export function dispatchAmirantCourseCoach(detail: AmirantCourseCoachEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AMIRANT_COURSE_COACH_EVENT, { detail }));
}

export function dispatchAmirantQuestionContext(detail: AmirantQuestionContextDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AMIRANT_COURSE_QUESTION_CONTEXT_EVENT, { detail }));
}
