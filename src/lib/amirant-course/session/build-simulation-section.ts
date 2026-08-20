import type { DifficultyLevel, QuestionPoolItem } from "@/lib/learning-intelligence/adaptive";
import type { BankQuestionPublic } from "../question-bank/public-bank";
import { pickAdaptiveQuestionIds } from "../adaptive/pick-from-bank";

/**
 * Builds the question list for one simulation section.
 *
 * Reading comprehension needs its own path: the adaptive picker selects purely by
 * topic and difficulty, and the pool items it works on do not carry `passageId`.
 * Used directly, a five-question reading section returns five questions attached
 * to five *different* passages — roughly 1,500 words to read inside a 15-minute
 * budget written for one passage. Here the section is anchored to a single
 * passage, the way the real exam presents it.
 */

const READING_TOPIC = "reading_comprehension";

function hash(seed: string): number {
  let h = 2166136261 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Questions are authored in reading order; the id suffix preserves it. */
function questionOrdinal(id: string): number {
  const m = id.match(/-q(\d+)$/);
  return m ? Number(m[1]) : 0;
}

function pickReadingSection(params: {
  bank: BankQuestionPublic[];
  count: number;
  excludeIds: Set<string>;
  tieBreakSalt: string;
}): string[] {
  const { bank, count, excludeIds, tieBreakSalt } = params;

  const byPassage = new Map<string, BankQuestionPublic[]>();
  for (const q of bank) {
    if (q.topicSlug !== READING_TOPIC || !q.passageId) continue;
    const list = byPassage.get(q.passageId) ?? [];
    list.push(q);
    byPassage.set(q.passageId, list);
  }

  const candidates = Array.from(byPassage.entries())
    .filter(([, questions]) => questions.length >= count)
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (candidates.length === 0) return [];

  // A passage the learner has already met in this run (or in practice, when the
  // caller passes those ids in) carries no measurement value the second time.
  const fresh = candidates.filter(([, questions]) => questions.every((q) => !excludeIds.has(q.id)));
  const pool = fresh.length > 0 ? fresh : candidates;

  const chosen = pool[hash(tieBreakSalt) % pool.length]!;
  return chosen[1]
    .slice()
    .sort((a, b) => questionOrdinal(a.id) - questionOrdinal(b.id))
    .slice(0, count)
    .map((q) => q.id);
}

export function buildSimulationSectionQuestionIds(params: {
  pool: QuestionPoolItem[];
  bank: BankQuestionPublic[];
  topicSlug: string;
  targetLevel: DifficultyLevel;
  count: number;
  excludeIds: string[];
  tieBreakSalt: string;
}): string[] {
  const { pool, bank, topicSlug, targetLevel, count, excludeIds, tieBreakSalt } = params;

  if (topicSlug === READING_TOPIC) {
    const ids = pickReadingSection({
      bank,
      count,
      excludeIds: new Set(excludeIds),
      tieBreakSalt,
    });
    if (ids.length > 0) return ids;
    // No passage has enough questions — fall through rather than show an empty section.
  }

  return pickAdaptiveQuestionIds({
    pool,
    topicId: topicSlug,
    targetLevel,
    count,
    excludeIds,
    tieBreakSalt,
  });
}
