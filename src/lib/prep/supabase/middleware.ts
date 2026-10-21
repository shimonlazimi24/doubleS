import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** What the middleware knows about the signed-in user: the verified JWT claims, no profile. */
export type MiddlewareUser = {
  id: string;
  email: string | null;
  app_metadata: Record<string, unknown>;
};

/**
 * Refresh the Supabase session in middleware; returns the user and the response
 * carrying any refreshed cookies.
 *
 * Identity comes from `getClaims()`, which verifies the access token's signature.
 * On a project with asymmetric JWT signing keys that is a local check against
 * the cached public key, so the middleware no longer waits on the auth server
 * for every navigation; on a project still signing with the legacy shared
 * secret the library falls back to a server call, the same cost as before.
 */
export async function getPrepUserFromMiddleware(request: NextRequest): Promise<{
  user: MiddlewareUser | null;
  response: NextResponse;
  supabase: SupabaseClient | null;
}> {
  const env = getPrepSupabasePublishableEnv();
  if (!env) {
    return { user: null, response: NextResponse.next(), supabase: null };
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user: MiddlewareUser | null = claims?.sub
    ? {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
        app_metadata: (claims.app_metadata as Record<string, unknown> | undefined) ?? {},
      }
    : null;

  return { user, response: supabaseResponse, supabase };
}
