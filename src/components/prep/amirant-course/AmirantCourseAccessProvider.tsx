"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";

type AccessApi = {
  hasFullAccess: boolean;
  loading: boolean;
  userId: string | null;
};

const Ctx = createContext<AccessApi>({ hasFullAccess: false, loading: true, userId: null });

export function AmirantCourseAccessProvider({ children }: { children: ReactNode }) {
  const envFull = getPrepHasFullAccess();
  const [hasFullAccess, setHasFullAccess] = useState(envFull);
  const [loading, setLoading] = useState(!envFull);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (envFull) {
      setHasFullAccess(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      const client = createPrepSupabaseBrowserClient();
      if (!client) {
        if (!cancelled) {
          setHasFullAccess(false);
          setLoading(false);
        }
        return;
      }
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setUserId(null);
          setHasFullAccess(false);
          setLoading(false);
        }
        return;
      }
      const access = await hasAmirantFullAccess(client, user.id);
      if (!cancelled) {
        setUserId(user.id);
        setHasFullAccess(access);
        setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [envFull]);

  const value = useMemo(
    () => ({ hasFullAccess, loading, userId }),
    [hasFullAccess, loading, userId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAmirantCourseAccess(): AccessApi {
  return useContext(Ctx);
}
