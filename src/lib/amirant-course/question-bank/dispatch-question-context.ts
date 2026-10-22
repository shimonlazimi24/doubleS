import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";
import { amirantExamQuestionPromptForDisplay } from "./prompt-for-display";
import type { BankQuestionPublic } from "./public-bank";
import type { ClientPassage } from "./client-types";

/**
 * Tells the floating chat which bank question is on screen: prompt, options and passage,
 * plus whether the learner has already chosen. Never the key - the browser only has the
 * public rows the server handed to this page; the server resolves the key by `questionId`
 * only when allowed.
 */
export function dispatchBankQuestionContext(params: {
  question: BankQuestionPublic;
  /** The passage the page already holds for this question, when it has one. */
  passage?: ClientPassage | null;
  /** Adaptive quiz, placement and simulation are timed: the key stays hidden until answered. */
  timed: boolean;
  selectedOptionId: string | null | undefined;
  lessonId?: string;
}): void {
  const { question: q, passage } = params;
  dispatchAmirantQuestionContext({
    kind: "quiz_question",
    questionText: amirantExamQuestionPromptForDisplay(q.prompt),
    questionId: q.id,
    topic: q.topicSlug,
    questionType: q.topicSlug,
    options: q.options.map((o) => ({ id: o.id, label: o.label })),
    passageText: passage ? passage.bodyMarkdown.slice(0, 4000) : undefined,
    timed: params.timed,
    answered: params.selectedOptionId != null,
    selectedOptionId: params.selectedOptionId ?? null,
    lessonId: params.lessonId,
  });
}
