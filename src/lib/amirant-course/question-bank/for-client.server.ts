/**
 * Server side of the question hand-off: picks the rows a page (or the
 * questions API) may give the browser and strips them to the public shape.
 *
 * Imports the full bank, so it must only be used from server components and
 * route handlers. (No `server-only` marker: the unit tests import it under
 * vitest.) Access is the caller's job: a page calls this after its access gate,
 * and the API route decides per question with `question-access.ts`.
 */
import type { BankQuestion } from "../types/bank-question";
import type { BankQuestionPublic } from "./public-bank";
import type { ClientPassage, ClientPoolQuestion, ClientQuestionSet } from "./client-types";
import {
  AMIRANT_BANK_QUESTIONS,
  AMIRANT_GENERAL_BANK_QUESTIONS,
  getBankQuestion,
  getPassage,
} from "./index";
import { isOwnerSetQuestion } from "./reserved-tags";

/**
 * Public row without tags: the browser never filters by tag (the server has
 * already chosen the pool), and the tags only add bytes.
 */
export function toClientQuestion(q: BankQuestion): BankQuestionPublic {
  return {
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    topicSlug: q.topicSlug,
    subtopicSlug: q.subtopicSlug,
    difficulty: q.difficulty,
    passageId: q.passageId,
  };
}

export function toClientPoolQuestion(q: BankQuestion): ClientPoolQuestion {
  return {
    id: q.id,
    topicSlug: q.topicSlug,
    subtopicSlug: q.subtopicSlug,
    difficulty: q.difficulty,
    passageId: q.passageId,
  };
}

export function toClientPassage(passageId: string): ClientPassage | undefined {
  const p = getPassage(passageId);
  if (!p) return undefined;
  return {
    id: p.passageId,
    title: p.title,
    bodyMarkdown: p.bodyMarkdown,
    ...(p.revealMarkdown ? { revealMarkdown: p.revealMarkdown } : {}),
  };
}

/** The given rows plus every passage they reference, each passage once. */
export function clientQuestionSetFor(questions: readonly BankQuestion[]): ClientQuestionSet {
  const passages = new Map<string, ClientPassage>();
  for (const q of questions) {
    if (!q.passageId || passages.has(q.passageId)) continue;
    const p = toClientPassage(q.passageId);
    if (p) passages.set(p.id, p);
  }
  return { questions: questions.map(toClientQuestion), passages: Array.from(passages.values()) };
}

/** Rows for the ids, in the order given; ids that are not in the bank are skipped. */
export function clientQuestionSetForIds(ids: readonly string[]): ClientQuestionSet {
  const rows = ids.map((id) => getBankQuestion(id)).filter((q): q is BankQuestion => q != null);
  return clientQuestionSetFor(rows);
}

let generalPool: ClientPoolQuestion[] | undefined;
let simulationPool: ClientPoolQuestion[] | undefined;

/** The general bank as a pool: no simulation questions, none of the owner's sets. */
export function generalPoolForClient(): ClientPoolQuestion[] {
  if (!generalPool) generalPool = AMIRANT_GENERAL_BANK_QUESTIONS.map(toClientPoolQuestion);
  return generalPool;
}

/** What the interactive simulation may draw from: everything but the owner's sets. */
export function simulationPoolForClient(): ClientPoolQuestion[] {
  if (!simulationPool) {
    simulationPool = AMIRANT_BANK_QUESTIONS.filter((q) => !isOwnerSetQuestion(q.tags)).map(toClientPoolQuestion);
  }
  return simulationPool;
}
