import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refresh Supabase session in middleware; returns user + response with updated cookies.
 */
export async function getPrepUserFromMiddleware(request: NextRequest): Promise<{
  user: User | null;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response: supabaseResponse, supabase };
}
