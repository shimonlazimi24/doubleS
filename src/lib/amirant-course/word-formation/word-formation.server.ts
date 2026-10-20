/**
 * The content owner's word-formation tests, with their answer keys.
 *
 * Server only: the lesson page and the grade-word route import this. The
 * browser receives `WordFormationPublicItem`s through props, and
 * `scripts/check-client-chunks.mjs` fails the build if the accepted forms
 * ever reach a client chunk.
 */
import wfJson from "../../../../content/amirant-import/owner/wf-tests.json";
import type { WordFormationKey } from "./grade-word";
import type { WordFormationPublicItem } from "./types";

type WordFormationItem = WordFormationPublicItem & {
  test: number;
  accepted: string[];
  mistakes: Record<string, string>;
  explanation: string;
};

// The JSON is validated by ingest-owner-wf-tests.mjs; its inferred type is a union of 40 shapes.
const ITEMS = wfJson as unknown as WordFormationItem[];
const BY_ID = new Map(ITEMS.map((x) => [x.id, x]));

export function getWordFormationTest(test: number): WordFormationPublicItem[] {
  return ITEMS.filter((x) => x.test === test)
    .sort((a, b) => a.n - b.n)
    .map(({ id, n, sentence, baseWord }) => ({ id, n, sentence, baseWord }));
}

export function getWordFormationItem(id: string): (WordFormationKey & { explanation: string }) | undefined {
  const x = BY_ID.get(id);
  return x ? { baseWord: x.baseWord, accepted: x.accepted, mistakes: x.mistakes, explanation: x.explanation } : undefined;
}

export function wordFormationTestCount(): number {
  return new Set(ITEMS.map((x) => x.test)).size;
}
