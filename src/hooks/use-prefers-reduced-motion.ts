"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `true` when the user prefers reduced motion (for transitions / scroll / animation).
 * Server snapshot: prefer false so first paint is consistent with motion-allowed until hydrated.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    useCallback((onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []),
    useCallback(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []),
    useCallback(() => false, []),
  );
}
