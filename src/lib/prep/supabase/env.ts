/** Publishable Supabase keys (browser + SSR). Never put service_role here. */
export type PrepSupabasePublishableEnv = {
  url: string;
  anonKey: string;
};

export function getPrepSupabasePublishableEnv(): PrepSupabasePublishableEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
