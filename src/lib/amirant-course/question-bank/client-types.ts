/**
 * The shapes a question takes once it is handed to the browser.
 *
 * Nothing here imports data. Until 2026-10-22 every quiz and lesson page
 * statically imported `questions.public.json` (748 questions, the owner's paid
 * sets and the simulations included) and `passages.json`, so the free placement
 * test shipped ~500KB of paid question text to every visitor. Now the server
 * serialises only what a page needs (`for-client.server.ts`), or the browser
 * asks `/api/prep/amirant-course/questions` for a short list of ids
 * (`question-set-client.ts`). Client modules import these types and helpers only.
 */
import type { QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import type { BankQuestionPublic } from "./public-bank";

export type ClientPassage = {
  id: string;
  title?: string;
  bodyMarkdown: string;
  /** A listening clip's transcript: rendered only once the answers are checked. */
  revealMarkdown?: string;
};

/** Questions plus the reading passages they point at — what one page or one fetch carries. */
export type ClientQuestionSet = {
  questions: BankQuestionPublic[];
  passages: ClientPassage[];
};

/**
 * What an adaptive picker needs to know about a question before choosing it:
 * never its text, options or answer. A pool of these is small enough to be a
 * page prop even for the whole general bank.
 */
export type ClientPoolQuestion = Pick<
  BankQuestionPublic,
  "id" | "topicSlug" | "subtopicSlug" | "difficulty" | "passageId"
>;

export function bankQuestionsPublicToPoolItems(questions: readonly ClientPoolQuestion[]): QuestionPoolItem[] {
  return questions.map((q) => ({
    questionId: q.id,
    topicId: q.topicSlug,
    subtopicId: q.subtopicSlug,
    difficultyLevel: q.difficulty,
  }));
}

export function indexClientQuestionSet(set: ClientQuestionSet): {
  questionsById: Map<string, BankQuestionPublic>;
  passagesById: Map<string, ClientPassage>;
} {
  return {
    questionsById: new Map(set.questions.map((q) => [q.id, q])),
    passagesById: new Map(set.passages.map((p) => [p.id, p])),
  };
}
