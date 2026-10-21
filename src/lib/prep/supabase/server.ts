import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Route handlers / Server Components: Supabase with cookie read/write when allowed.
 *
 * Memoized per request (React `cache`), so the layout, the page and every
 * helper they call share one client, and `getPrepServerUser` below can
 * answer once for all of them.
 */
export const createPrepSupabaseServerClient = cache(function createPrepSupabaseServerClient() {
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
});

/**
 * The signed-in user for this request, resolved once.
 *
 * `auth.getUser()` is a network call to Supabase (Tokyo, ~300ms from the
 * Frankfurt functions). The course layout and the page it wraps both need the
 * user, and before this helper each of them paid for its own call on every
 * navigation. The result is memoized per request, so the second caller gets
 * the first caller's answer.
 */
export const getPrepServerUser = cache(async function getPrepServerUser() {
  const client = createPrepSupabaseServerClient();
  if (!client) return { client: null, user: null };
  const {
    data: { user },
  } = await client.auth.getUser();
  return { client, user };
});
