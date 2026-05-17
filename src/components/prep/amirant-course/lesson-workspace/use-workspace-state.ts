"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BuiltWorkspaceStep } from "./workspace-step";

const PREFIX = "amirant-ws";

function readStored(lessonId: string, stepCount: number): { index: number; done: number[] } | null {
  if (typeof window === "undefined" || stepCount < 1) return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}-${lessonId}`);
    if (!raw) return null;
    const p = JSON.parse(raw) as { v: number; index: number; done: number[] };
    if (p.v !== 1 || !Array.isArray(p.done) || typeof p.index !== "number") return null;
    const index = Math.max(0, Math.min(stepCount - 1, Math.floor(p.index)));
    const done = p.done.filter((x) => x >= 0 && x < stepCount);
    return { index, done: Array.from(new Set(done)) };
  } catch {
    return null;
  }
}

function writeStored(lessonId: string, index: number, done: Set<number>, stepCount: number): void {
  try {
    const arr = Array.from(done)
      .filter((x) => x >= 0 && x < stepCount)
      .sort((a, b) => a - b);
    sessionStorage.setItem(`${PREFIX}-${lessonId}`, JSON.stringify({ v: 1, index, done: arr }));
  } catch {
    /* */
  }
}

export function useWorkspaceState(lessonId: string, steps: BuiltWorkspaceStep[]) {
  const n = steps.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = readStored(lessonId, n);
    if (s) {
      setActiveIndex(s.index);
      setDone(new Set(s.done));
    }
    setHydrated(true);
  }, [lessonId, n]);

  const skipClampOnce = useRef(true);
  useEffect(() => {
    skipClampOnce.current = true;
  }, [lessonId]);

  /** Keep index in range when step list length changes (skip once after mount / lesson change so hydration wins). */
  useEffect(() => {
    if (n < 1) return;
    if (skipClampOnce.current) {
      skipClampOnce.current = false;
      return;
    }
    setActiveIndex((prev) => Math.max(0, Math.min(prev, n - 1)));
  }, [n]);

  useEffect(() => {
    if (!hydrated || n < 1) return;
    writeStored(lessonId, activeIndex, done, n);
  }, [lessonId, activeIndex, done, hydrated, n]);

  const go = useCallback(
    (i: number) => {
      setActiveIndex((prev) => {
        const t = Math.max(0, Math.min(n - 1, i));
        return t;
      });
    },
    [n],
  );

  const next = useCallback(() => {
    setDone((d) => new Set(d).add(activeIndex));
    go(activeIndex + 1);
  }, [activeIndex, go]);

  const prev = useCallback(() => {
    go(activeIndex - 1);
  }, [activeIndex, go]);

  const selectStep = useCallback(
    (i: number) => {
      if (i >= 0 && i < n) setActiveIndex(i);
    },
    [n],
  );

  const progressPercent = useMemo(() => {
    if (n < 1) return 0;
    return Math.min(100, Math.round(((activeIndex + 1) / n) * 100));
  }, [activeIndex, n]);

  return {
    activeIndex,
    completedIndices: done,
    next,
    prev,
    go,
    selectStep,
    progressPercent,
    hydrated,
  };
}
