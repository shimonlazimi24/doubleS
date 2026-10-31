"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `true` when the viewport matches `query`. The server snapshot is `false`, so
 * markup that depends on it appears after hydration - fine for chrome that is
 * closed on first paint anyway.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    useCallback(
      (onChange) => {
        const mq = window.matchMedia(query);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
      },
      [query],
    ),
    useCallback(() => window.matchMedia(query).matches, [query]),
    useCallback(() => false, []),
  );
}
