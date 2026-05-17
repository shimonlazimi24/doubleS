"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

/**
 * Browser-only Supabase client. Import only from Client Components.
 * Uses publishable anon env key; relies on Postgres RLS (never service_role here).
 * Returns null if keys are unset.
 */
export function createPrepSupabaseBrowserClient() {
  const env = getPrepSupabasePublishableEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
