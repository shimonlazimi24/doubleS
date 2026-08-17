import { AMIRANT_PREPARATION_COURSE_ID } from "./constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadAmirantProgressState,
  markLessonCompletedState,
  markLessonStartedState,
  saveAmirantProgressState,
} from "./progress/storage";
import { mergeAmirantProgressStates } from "./progress/merge";

export { mergeAmirantProgressStates } from "./progress/merge";
import {
  defaultAmirantProgressState,
  type AmirantProgressStateV1,
} from "./progress/types";

/**
 * Progress persistence boundary for UI components.
 * Replace with Supabase-backed implementation without changing consumers.
 */
export interface AmirantProgressService {
  load(): AmirantProgressStateV1;
  save(state: AmirantProgressStateV1): void;
  markLessonStarted(
    prev: AmirantProgressStateV1,
    lessonId: string,
  ): AmirantProgressStateV1;
  markLessonCompleted(
    prev: AmirantProgressStateV1,
    lessonId: string,
  ): AmirantProgressStateV1;
}

type SupabaseLessonProgressStatus = "not_started" | "in_progress" | "completed";
type SupabaseLessonProgressRow = {
  lesson_id: string;
  user_id: string;
  status: SupabaseLessonProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

const SUPABASE_PROGRESS_TABLE = "amirant_lesson_progress";

export function createLocalStorageAmirantProgressService(): AmirantProgressService {
  return {
    load: loadAmirantProgressState,
    save: saveAmirantProgressState,
    markLessonStarted: (prev, lessonId) => markLessonStartedState(prev, lessonId),
    markLessonCompleted: (prev, lessonId) => markLessonCompletedState(prev, lessonId),
  };
}

export async function loadSupabaseAmirantProgressState(
  client: SupabaseClient,
  userId: string,
): Promise<AmirantProgressStateV1> {
  const { data, error } = await client
    .from(SUPABASE_PROGRESS_TABLE)
    .select("lesson_id,user_id,status,started_at,completed_at,updated_at")
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
  const next = defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
  for (const row of (data ?? []) as SupabaseLessonProgressRow[]) {
    if (!row.lesson_id) continue;
    const startedAt = row.started_at ?? row.completed_at ?? row.updated_at;
    next.lessons[row.lesson_id] = {
      startedAt,
      ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    };
  }
  return next;
}

async function upsertSupabaseLessonProgress(
  client: SupabaseClient,
  userId: string,
  payload: {
    lessonId: string;
    status: SupabaseLessonProgressStatus;
    startedAt: string;
    completedAt?: string;
  },
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const row = {
    user_id: userId,
    lesson_id: payload.lessonId,
    status: payload.status,
    started_at: payload.startedAt,
    completed_at: payload.completedAt ?? null,
    updated_at: updatedAt,
  };
  const { error } = await client
    .from(SUPABASE_PROGRESS_TABLE)
    .upsert(row, { onConflict: "user_id,lesson_id" });
  if (error) {
    throw error;
  }
}

/**
 * Supabase-backed progress service for authenticated users.
 * `load()` returns an empty state; caller should hydrate via `loadSupabaseAmirantProgressState`.
 */
export function createSupabaseAmirantProgressService(
  client: SupabaseClient,
  userId: string,
): AmirantProgressService {
  return {
    load: () => emptyProgressState(),
    save: () => {
      // No-op: writes are performed in markLesson* upserts.
    },
    markLessonStarted: (prev, lessonId) => {
      const now = new Date().toISOString();
      const next = markLessonStartedState(prev, lessonId, now);
      const cur = next.lessons[lessonId];
      if (!cur) return next;
      const status: SupabaseLessonProgressStatus = cur.completedAt ? "completed" : "in_progress";
      void upsertSupabaseLessonProgress(client, userId, {
        lessonId,
        status,
        startedAt: cur.startedAt,
        completedAt: cur.completedAt,
      });
      return next;
    },
    markLessonCompleted: (prev, lessonId) => {
      const now = new Date().toISOString();
      const next = markLessonCompletedState(prev, lessonId, now);
      const cur = next.lessons[lessonId];
      if (!cur) return next;
      void upsertSupabaseLessonProgress(client, userId, {
        lessonId,
        status: "completed",
        startedAt: cur.startedAt,
        completedAt: cur.completedAt,
      });
      return next;
    },
  };
}

export function emptyProgressState(): AmirantProgressStateV1 {
  return defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
}

/** Push merged local lessons to Supabase after login. */
export async function uploadAmirantProgressLessons(
  client: SupabaseClient,
  userId: string,
  state: AmirantProgressStateV1,
  lessonIds: string[],
): Promise<void> {
  await Promise.all(
    lessonIds.map(async (lessonId) => {
      const entry = state.lessons[lessonId];
      if (!entry) return;
      const status: SupabaseLessonProgressStatus = entry.completedAt ? "completed" : "in_progress";
      await upsertSupabaseLessonProgress(client, userId, {
        lessonId,
        status,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
      });
    }),
  );
}

export async function hydrateAmirantProgressForUser(
  client: SupabaseClient,
  userId: string,
  localService: AmirantProgressService = createLocalStorageAmirantProgressService(),
): Promise<AmirantProgressStateV1> {
  const local = localService.load();
  const remote = await loadSupabaseAmirantProgressState(client, userId).catch(() => emptyProgressState());
  const { merged, lessonsToUpload } = mergeAmirantProgressStates(local, remote);
  if (lessonsToUpload.length > 0) {
    await uploadAmirantProgressLessons(client, userId, merged, lessonsToUpload);
  }
  // Dual-write: keep local cache aligned with merged account progress after login.
  localService.save(merged);
  return merged;
}
