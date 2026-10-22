/**
 * Writing submissions: the learner's essays and their verdicts.
 *
 * Stored in `prep_writing_submissions` through the service role (see
 * supabase/writing-submissions-schema.sql). Without a Supabase service client
 * (local development) an in-process list stands in, so the flow works end to
 * end; it is per process and forgets on restart.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { countWords, WRITING_LIMITS, type WritingGradeResult, type WritingSubmission } from "./types";

const TABLE = "prep_writing_submissions";

type Row = {
  id: string;
  user_id: string;
  task_id: string;
  text: string;
  word_count: number;
  status: WritingSubmission["status"];
  result: WritingGradeResult | null;
  model: string | null;
  created_at: string;
  graded_at: string | null;
};

const toSubmission = (r: Row): WritingSubmission => ({
  id: r.id,
  taskId: r.task_id,
  text: r.text,
  wordCount: r.word_count,
  status: r.status,
  result: r.result,
  createdAt: r.created_at,
  gradedAt: r.graded_at,
});

const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

/* ---------------- in-memory fallback (no service client) ---------------- */

const memory: Row[] = [];
let memorySeq = 0;

function memoryStore(): Store {
  return {
    async countToday(userId, taskId) {
      const since = startOfToday();
      const mine = memory.filter((r) => r.user_id === userId && r.created_at >= since);
      return { user: mine.length, task: mine.filter((r) => r.task_id === taskId).length };
    },
    async create(userId, taskId, text, model) {
      memorySeq += 1;
      const row: Row = {
        id: `local-${memorySeq}`,
        user_id: userId,
        task_id: taskId,
        text,
        word_count: countWords(text),
        status: "grading",
        result: null,
        model,
        created_at: new Date().toISOString(),
        graded_at: null,
      };
      memory.unshift(row);
      return toSubmission(row);
    },
    async finish(id, result) {
      const row = memory.find((r) => r.id === id);
      if (!row) return;
      row.status = result ? "graded" : "failed";
      row.result = result;
      row.graded_at = new Date().toISOString();
    },
    async list(userId, taskId) {
      return memory.filter((r) => r.user_id === userId && (!taskId || r.task_id === taskId)).slice(0, 30).map(toSubmission);
    },
  };
}

/* ---------------- Supabase store ---------------- */

function supabaseStore(client: SupabaseClient): Store {
  return {
    async countToday(userId, taskId) {
      const since = startOfToday();
      const { data, error } = await client.from(TABLE).select("task_id").eq("user_id", userId).gte("created_at", since);
      if (error) throw new Error(`writing count: ${error.message}`);
      const rows = (data ?? []) as { task_id: string }[];
      return { user: rows.length, task: rows.filter((r) => r.task_id === taskId).length };
    },
    async create(userId, taskId, text, model) {
      const { data, error } = await client
        .from(TABLE)
        .insert({ user_id: userId, task_id: taskId, text, word_count: countWords(text), status: "grading", model })
        .select("*")
        .single();
      if (error || !data) throw new Error(`writing insert: ${error?.message ?? "no row"}`);
      return toSubmission(data as Row);
    },
    async finish(id, result) {
      const { error } = await client
        .from(TABLE)
        .update({ status: result ? "graded" : "failed", result, graded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(`writing update: ${error.message}`);
    },
    async list(userId, taskId) {
      let q = client.from(TABLE).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
      if (taskId) q = q.eq("task_id", taskId);
      const { data, error } = await q;
      if (error) throw new Error(`writing list: ${error.message}`);
      return ((data ?? []) as Row[]).map(toSubmission);
    },
  };
}

export type Store = {
  countToday(userId: string, taskId: string): Promise<{ user: number; task: number }>;
  create(userId: string, taskId: string, text: string, model: string): Promise<WritingSubmission>;
  finish(id: string, result: WritingGradeResult | null): Promise<void>;
  list(userId: string, taskId?: string): Promise<WritingSubmission[]>;
};

export function getWritingStore(): { store: Store; persistent: boolean } {
  const client = getPrepSupabaseServiceClient();
  return client ? { store: supabaseStore(client), persistent: true } : { store: memoryStore(), persistent: false };
}

/** Which daily cap, if any, the next submission would break. */
export function limitExceeded(counts: { user: number; task: number }): "task" | "user" | null {
  if (counts.task >= WRITING_LIMITS.perTaskPerDay) return "task";
  if (counts.user >= WRITING_LIMITS.perUserPerDay) return "user";
  return null;
}
