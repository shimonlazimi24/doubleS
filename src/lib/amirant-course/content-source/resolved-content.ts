import { z } from "zod";
import { mapSourceQuestionsToBank } from "./import";
import { AMIRANT_QUESTION_SOURCE } from "./question-source";
import { questionSourceItemSchema, passageSourceItemSchema } from "./schemas";
import type { BankQuestion } from "../types/bank-question";

/**
 * Runtime view of the authoring package: the question bank and the passages,
 * validated once per process and cached.
 *
 * Until 2026-10-22 this module ran the full package import on first use —
 * parsing lessons.json and ai-retrieval.json as well — only to find that the
 * package never passes its readiness gate (simulations.json has no pilot
 * section), discard everything and fall back to validating the questions
 * alone. The full import now lives in `resolved-package.ts`, which only the
 * manifest generator and tests reach.
 */

let cachedBank: BankQuestion[] | null | undefined;

/** The real question bank, or null when the question file fails validation. */
export function getResolvedAmirantQuestionBank(): BankQuestion[] | null {
  if (cachedBank !== undefined) return cachedBank;
  try {
    const rows = z.array(questionSourceItemSchema).parse(AMIRANT_QUESTION_SOURCE.questions);
    cachedBank = rows.length > 0 ? mapSourceQuestionsToBank(rows) : null;
    return cachedBank;
  } catch (e) {
    // eslint-disable-next-line no-console -- a broken question bank is a content failure that must be visible
    console.error("[amirant-bank] question source failed validation:", e instanceof Error ? e.message : e);
    cachedBank = null;
    return null;
  }
}

export type AmirantPassage = z.infer<typeof passageSourceItemSchema>;

/**
 * Blockquote markers ("> ") are an extraction artifact, not passage semantics:
 * the blockquote renderer caps long quotes with an inner scroll, so paragraphs
 * two onwards "disappear" and the question looks unrelated (reported from the
 * placement test). Normalised to plain paragraphs at load time, for every consumer.
 */
function stripBlockquoteMarkers(md: string): string {
  return md.replace(/^>[ \t]?/gm, "");
}

let cachedPassages: Map<string, AmirantPassage> | undefined;

/**
 * Reading passages keyed by passageId. Validated row by row: one broken
 * passage does not take the others down (an RC question without its passage
 * cannot be answered) - it is skipped with an error in the log.
 */
export function getResolvedAmirantPassages(): Map<string, AmirantPassage> {
  if (cachedPassages !== undefined) return cachedPassages;
  const map = new Map<string, AmirantPassage>();
  const rows = Array.isArray(AMIRANT_QUESTION_SOURCE.passages) ? AMIRANT_QUESTION_SOURCE.passages : [];
  for (const raw of rows) {
    const parsed = passageSourceItemSchema.safeParse(raw);
    if (parsed.success) {
      map.set(parsed.data.passageId, {
        ...parsed.data,
        bodyMarkdown: stripBlockquoteMarkers(parsed.data.bodyMarkdown),
      });
    } else {
      // eslint-disable-next-line no-console -- content failure that needs a fix on the scripts side
      console.error("[amirant-passages] invalid passage row skipped:", parsed.error.issues[0]?.message, raw);
    }
  }
  cachedPassages = map;
  return cachedPassages;
}
