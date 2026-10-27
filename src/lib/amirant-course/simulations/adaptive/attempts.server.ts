/**
 * What an adaptive attempt leaves behind: the pool item ids a learner has met
 * (so no attempt repeats them), one row per attempt in
 * amirant_simulation_attempts, one per section in amirant_simulation_sections,
 * and the report in amirant_learning_events (event_type
 * "adaptive_simulation_submitted"), which the attempts list reads.
 *
 * Without Supabase (local dev) the same shape lives in memory for the process.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttemptReport, AttemptSummary, SectionResult } from "./types";

export const ADAPTIVE_SIMULATION_ID = "adaptive-pool";
const SECTION_EVENT = "adaptive_simulation_section";
const SUBMIT_EVENT = "adaptive_simulation_submitted";

type Store = {
  usedIds(): Promise<string[]>;
  startAttempt(startLevel: number): Promise<string | null>;
  recordSection(attemptId: string | null, result: SectionResult, usedIds: string[], answers: unknown[]): Promise<void>;
  finishAttempt(report: AttemptReport, usedIds: string[]): Promise<void>;
  listAttempts(): Promise<AttemptSummary[]>;
};

const memory = new Map<string, { used: Set<string>; attempts: AttemptSummary[] }>();

function memoryStore(userKey: string): Store {
  const slot = memory.get(userKey) ?? { used: new Set<string>(), attempts: [] };
  memory.set(userKey, slot);
  return {
    async usedIds() {
      return Array.from(slot.used);
    },
    async startAttempt() {
      return `local-${Date.now().toString(36)}`;
    },
    async recordSection(_a, _r, usedIds) {
      for (const id of usedIds) slot.used.add(id);
    },
    async finishAttempt(report, usedIds) {
      for (const id of usedIds) slot.used.add(id);
      slot.attempts.unshift({
        attemptId: report.attemptId ?? "local",
        finishedAt: report.finishedAt,
        score: report.score,
        low: report.low,
        high: report.high,
        bandHe: report.bandHe,
        finalLevel: report.finalLevel,
      });
    },
    async listAttempts() {
      return [...slot.attempts];
    },
  };
}

function supabaseStore(client: SupabaseClient, userId: string): Store {
  return {
    async usedIds() {
      const { data } = await client
        .from("amirant_learning_events")
        .select("metadata")
        .eq("user_id", userId)
        .in("event_type", [SECTION_EVENT, SUBMIT_EVENT])
        .limit(2000);
      const out = new Set<string>();
      for (const row of data ?? []) {
        const ids = (row as { metadata?: { usedIds?: unknown } }).metadata?.usedIds;
        if (Array.isArray(ids)) for (const id of ids) if (typeof id === "string") out.add(id);
      }
      return Array.from(out);
    },
    async startAttempt(startLevel) {
      const now = new Date().toISOString();
      const { data } = await client
        .from("amirant_simulation_attempts")
        .insert({
          user_id: userId,
          simulation_id: ADAPTIVE_SIMULATION_ID,
          source_mode: "production",
          started_at: now,
          start_level: Math.max(1, Math.min(6, Math.round(startLevel))),
          updated_at: now,
        })
        .select("id")
        .single();
      return (data?.id as string | undefined) ?? null;
    },
    async recordSection(attemptId, result, usedIds, answers) {
      const now = new Date().toISOString();
      if (attemptId) {
        await client.from("amirant_simulation_sections").upsert(
          {
            user_id: userId,
            attempt_id: attemptId,
            section_index: result.index,
            section_kind: result.kind === "scored" ? "scored" : "pilot",
            section_label: result.labelHe,
            topic: result.type,
            enter_level: Math.max(1, Math.min(6, Math.round(result.enterLevel))),
            question_count: result.total,
            correct_count: result.correct,
            time_limit_sec: 0,
            elapsed_sec: result.elapsedSec,
            answers,
            submitted_at: now,
          },
          { onConflict: "attempt_id,section_index,section_kind" },
        );
      }
      await client.from("amirant_learning_events").insert({
        user_id: userId,
        event_type: SECTION_EVENT,
        simulation_attempt_id: attemptId,
        metadata: { usedIds, sectionIndex: result.index, type: result.type, enterLevel: result.enterLevel, exitLevel: result.exitLevel },
      });
    },
    async finishAttempt(report, usedIds) {
      const now = new Date().toISOString();
      if (report.attemptId) {
        await client
          .from("amirant_simulation_attempts")
          .update({
            submitted_at: now,
            score_pct: report.scoredTotal ? Math.round((report.scoredCorrect / report.scoredTotal) * 100) : 0,
            scored_question_count: report.scoredTotal,
            scored_correct_count: report.scoredCorrect,
            end_level: Math.max(1, Math.min(6, Math.round(report.finalLevel))),
            updated_at: now,
          })
          .eq("id", report.attemptId)
          .eq("user_id", userId);
      }
      await client.from("amirant_learning_events").insert({
        user_id: userId,
        event_type: SUBMIT_EVENT,
        simulation_attempt_id: report.attemptId,
        metadata: { usedIds, report },
      });
    },
    async listAttempts() {
      const { data } = await client
        .from("amirant_learning_events")
        .select("metadata, created_at")
        .eq("user_id", userId)
        .eq("event_type", SUBMIT_EVENT)
        .order("created_at", { ascending: false })
        .limit(30);
      const out: AttemptSummary[] = [];
      for (const row of data ?? []) {
        const r = (row as { metadata?: { report?: AttemptReport } }).metadata?.report;
        if (!r) continue;
        out.push({ attemptId: r.attemptId ?? "", finishedAt: r.finishedAt, score: r.score, low: r.low, high: r.high, bandHe: r.bandHe, finalLevel: r.finalLevel });
      }
      return out;
    },
  };
}

export function getAdaptiveAttemptStore(client: SupabaseClient | null, userId: string | null): { store: Store; userKey: string; persistent: boolean } {
  if (client && userId) return { store: supabaseStore(client, userId), userKey: userId, persistent: true };
  return { store: memoryStore("local-dev"), userKey: "local-dev", persistent: false };
}
