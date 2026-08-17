"use client";

import { useEffect } from "react";

/**
 * Shared quiz timer — interval depends only on `active`, not on remaining seconds
 * (recreating every tick was a perf bug in AdaptiveQuiz).
 */
export function useQuizTimer(
  active: boolean,
  setSeconds: (updater: (s: number) => number) => void,
): void {
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [active, setSeconds]);
}
