import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only health checks, scripts, and admin.
 * Returns null if URL or `SUPABASE_SERVICE_ROLE_KEY` is not set. Never use in the browser.
 */
export function getPrepSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
