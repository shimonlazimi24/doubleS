import type { AmirantContentSourceInput } from "./schemas";
import questionsJson from "../../../../content/amirant-import/source/questions.json";
import passagesJson from "../../../../content/amirant-import/source/passages.json";

/**
 * The part of the authoring package the server reads at runtime: the question
 * bank and the reading passages. Server-only (answer keys included); client
 * code never imports it (`no-bank-in-client.test.ts`).
 *
 * The rest of the package (lessons, practice sets, simulations, retrieval
 * corpus, syllabus mapping) is only needed when the course manifest is
 * generated, so it lives in `production-source.ts` and is not loaded on a
 * cold start.
 */
export const AMIRANT_QUESTION_SOURCE: Pick<AmirantContentSourceInput, "questions" | "passages"> = {
  questions: questionsJson as AmirantContentSourceInput["questions"],
  passages: passagesJson as AmirantContentSourceInput["passages"],
};
