/** Client helper for /api/prep/amirant-course/questions */
import type { ClientQuestionSet } from "./question-bank/client-types";

/**
 * Fetches the public rows (and their passages) for a list of ids the browser
 * picked itself — a simulation section, a placement form, a weak-topics set.
 * Pages that know their questions up front get them as props instead.
 */
export async function fetchClientQuestionSet(ids: readonly string[]): Promise<ClientQuestionSet> {
  if (ids.length === 0) return { questions: [], passages: [] };
  const res = await fetch("/api/prep/amirant-course/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("question_set_failed");
  return (await res.json()) as ClientQuestionSet;
}
