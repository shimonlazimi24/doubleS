import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** Route handlers / Server Components: Supabase with cookie read/write when allowed. */
export function createPrepSupabaseServerClient() {
  const env = getPrepSupabasePublishableEnv();
  if (!env) return null;

  const cookieStore = cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Server Components cannot always set cookies; route handlers can. */
        }
      },
    },
  });
}
