import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/prep/amirant/continue";
  return next;
}

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** OAuth / magic-link session — cookies must be set on the redirect response. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next"));
  const origin = request.nextUrl.origin;

  const loginError = (error: string) =>
    NextResponse.redirect(
      `${origin}/prep/login?error=${error}&returnTo=${encodeURIComponent(next)}`,
    );

  const env = getPrepSupabasePublishableEnv();
  if (!env) {
    return loginError("missing_config");
  }

  let response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[prep/auth/callback] exchangeCodeForSession:", error.message);
      return loginError("auth");
    }
    return response;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) {
      console.error("[prep/auth/callback] verifyOtp:", error.message);
      return loginError("auth");
    }
    return response;
  }

  return loginError("missing_code");
}
