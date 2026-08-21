"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import {
  countCompletedLessons,
  countManifestLessons,
  courseProgressPercent,
  getLessonProgressStatus,
  moduleProgress,
  type LessonProgressStatus,
} from "@/lib/amirant-course/progress-calculations";
import {
  createSupabaseAmirantProgressService,
  createLocalStorageAmirantProgressService,
  emptyProgressState,
  hydrateAmirantProgressForUser,
  type AmirantProgressService,
} from "@/lib/amirant-course/progress";
import type { ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import type { AmirantProgressStateV1 } from "@/lib/amirant-course/progress/types";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { getBrowserUserId } from "@/lib/prep/supabase/browser-identity";

export type AmirantCourseProgressApi = {
  state: AmirantProgressStateV1;
  markLessonStarted: (lessonId: string) => void;
  markLessonCompleted: (lessonId: string) => void;
  getLessonStatus: (lessonId: string) => LessonProgressStatus;
  getModuleProgress: (module: ManifestModule) => { completed: number; total: number; percent: number };
  totalLessons: number;
  completedLessons: number;
  percentComplete: number;
  ready: boolean;
};

const Ctx = createContext<AmirantCourseProgressApi | null>(null);

export function AmirantCourseProgressProvider({ children }: { children: ReactNode }) {
  const localService = useMemo(() => createLocalStorageAmirantProgressService(), []);
  const [service, setService] = useState<AmirantProgressService>(localService);
  const [state, setState] = useState<AmirantProgressStateV1>(() => emptyProgressState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const client = createPrepSupabaseBrowserClient();
      if (!client) {
        if (!cancelled) {
          setService(localService);
          setState(localService.load());
          setReady(true);
        }
        return;
      }
      const uid = await getBrowserUserId(client);
      if (!uid) {
        if (!cancelled) {
          setService(localService);
          setState(localService.load());
          setReady(true);
        }
        return;
      }
      const merged = await hydrateAmirantProgressForUser(client, uid, localService).catch(() =>
        localService.load(),
      );
      const supabaseService = createSupabaseAmirantProgressService(client, uid);
      if (!cancelled) {
        setService(supabaseService);
        setState(merged);
        setReady(true);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [localService]);

  const markLessonStarted = useCallback(
    (lessonId: string) => {
      setState((prev) => {
        const next = service.markLessonStarted(prev, lessonId);
        if (next !== prev) {
          queueMicrotask(() => {
            service.save(next);
            // Keep guest-local cache warm while authenticated (offline / logout resume).
            localService.save(next);
          });
        }
        return next === prev ? prev : next;
      });
    },
    [service, localService],
  );

  const markLessonCompleted = useCallback(
    (lessonId: string) => {
      setState((prev) => {
        const next = service.markLessonCompleted(prev, lessonId);
        if (next !== prev) {
          queueMicrotask(() => {
            service.save(next);
            localService.save(next);
          });
        }
        return next === prev ? prev : next;
      });
    },
    [service, localService],
  );

  const value = useMemo((): AmirantCourseProgressApi => {
    const manifest = AMIRANT_PREPARATION_MANIFEST;
    const totalLessons = countManifestLessons(manifest);
    const completedLessons = countCompletedLessons(manifest, state);
    const percentComplete = courseProgressPercent(manifest, state);
    return {
      state,
      markLessonStarted,
      markLessonCompleted,
      getLessonStatus: (id) => getLessonProgressStatus(state, id),
      getModuleProgress: (module) => moduleProgress(module, state),
      totalLessons,
      completedLessons,
      percentComplete,
      ready,
    };
  }, [state, markLessonStarted, markLessonCompleted, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAmirantCourseProgress(): AmirantCourseProgressApi {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useAmirantCourseProgress must be used under AmirantCourseProgressProvider");
  }
  return v;
}

export function useAmirantCourseProgressOptional(): AmirantCourseProgressApi | null {
  return useContext(Ctx);
}
