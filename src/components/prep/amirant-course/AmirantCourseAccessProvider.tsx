"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { getBrowserUserId } from "@/lib/prep/supabase/browser-identity";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";

type AccessApi = {
  hasFullAccess: boolean;
  loading: boolean;
  userId: string | null;
  /** Re-check entitlement (e.g. after returning from checkout). */
  refreshAccess: () => Promise<void>;
};

const Ctx = createContext<AccessApi>({
  hasFullAccess: false,
  loading: true,
  userId: null,
  refreshAccess: async () => undefined,
});

export function AmirantCourseAccessProvider({ children }: { children: ReactNode }) {
  const envFull = getPrepHasFullAccess();
  const [hasFullAccess, setHasFullAccess] = useState(envFull);
  const [loading, setLoading] = useState(!envFull);
  const [userId, setUserId] = useState<string | null>(null);

  const refreshAccess = useCallback(async () => {
    if (envFull) {
      setHasFullAccess(true);
      setLoading(false);
      return;
    }
    const client = createPrepSupabaseBrowserClient();
    if (!client) {
      setHasFullAccess(false);
      setUserId(null);
      setLoading(false);
      return;
    }
    const uid = await getBrowserUserId(client);
    if (!uid) {
      setUserId(null);
      setHasFullAccess(false);
      setLoading(false);
      return;
    }
    const access = await hasAmirantFullAccess(client, uid);
    setUserId(uid);
    setHasFullAccess(access);
    setLoading(false);
  }, [envFull]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshAccess();
      if (cancelled) return;
    })();

    // After Hyp checkout the user often lands back with a stale one-shot check.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshAccess();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    // Short poll window right after mount (payment success race).
    const timers: number[] = [];
    if (!envFull) {
      for (const ms of [2_000, 5_000, 12_000]) {
        timers.push(window.setTimeout(() => void refreshAccess(), ms));
      }
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      for (const t of timers) window.clearTimeout(t);
    };
  }, [envFull, refreshAccess]);

  const value = useMemo(
    () => ({ hasFullAccess, loading, userId, refreshAccess }),
    [hasFullAccess, loading, userId, refreshAccess],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAmirantCourseAccess(): AccessApi {
  return useContext(Ctx);
}
