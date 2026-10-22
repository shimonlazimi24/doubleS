import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";
import { amirantExamQuestionPromptForDisplay } from "./prompt-for-display";
import { getClientPassage } from "./client-bank";
import type { BankQuestionPublic } from "./public-bank";

/**
 * Tells the floating chat which bank question is on screen: prompt, options and passage,
 * plus whether the learner has already chosen. Never the key - the bank in the browser
 * has none; the server resolves it by `questionId` only when allowed.
 */
export function dispatchBankQuestionContext(params: {
  question: BankQuestionPublic;
  /** Adaptive quiz, placement and simulation are timed: the key stays hidden until answered. */
  timed: boolean;
  selectedOptionId: string | null | undefined;
  lessonId?: string;
}): void {
  const { question: q } = params;
  const passage = q.passageId ? getClientPassage(q.passageId) : undefined;
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
