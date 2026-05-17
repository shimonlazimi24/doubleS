/** Publishable Supabase keys (browser + SSR). Never put service_role here. */
export type PrepSupabasePublishableEnv = {
  url: string;
  anonKey: string;
};

export function getPrepSupabasePublishableEnv(): PrepSupabasePublishableEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (anonKey.startsWith("sb_publishable_")) {
    console.error(
      "[prep] NEXT_PUBLIC_SUPABASE_ANON_KEY looks like a publishable key; use the legacy anon JWT (eyJ…) from Supabase → API Keys → Legacy.",
    );
  }
  return { url, anonKey };
}
