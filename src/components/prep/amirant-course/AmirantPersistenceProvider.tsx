"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createLocalFallbackPersistenceService,
  createSupabasePersistenceService,
  type AmirantPersistenceService,
} from "@/lib/amirant-course/persistence";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";

type AmirantPersistenceContextValue = {
  service: AmirantPersistenceService;
};

const AmirantPersistenceContext =
  createContext<AmirantPersistenceContextValue | null>(null);

export function AmirantPersistenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const localService = useMemo(() => createLocalFallbackPersistenceService(), []);
  const [service, setService] =
    useState<AmirantPersistenceService>(localService);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const client = createPrepSupabaseBrowserClient();
      if (!client) {
        setService(localService);
        return;
      }
      try {
        const remote = await createSupabasePersistenceService(client);
        if (!cancelled) setService(remote ?? localService);
      } catch {
        if (!cancelled) setService(localService);
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [localService]);

  const value = useMemo(() => ({ service }), [service]);

  return (
    <AmirantPersistenceContext.Provider value={value}>
      {children}
    </AmirantPersistenceContext.Provider>
  );
}

export function useAmirantPersistence(): AmirantPersistenceContextValue {
  const ctx = useContext(AmirantPersistenceContext);
  if (!ctx) {
    throw new Error(
      "useAmirantPersistence must be used inside AmirantPersistenceProvider",
    );
  }
  return ctx;
}
