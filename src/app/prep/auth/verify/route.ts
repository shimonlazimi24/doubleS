import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";
import { PREP_BASE } from "@/lib/prep/constants";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/prep/amirant/continue";
  return next;
}

/**
 * Server-side OTP / magic-link verification (dev script + direct links).
 * Sets session cookies on redirect — no PKCE verifier required.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash")?.trim();
  const token = searchParams.get("token")?.trim();
  const email = searchParams.get("email")?.trim();
  const typeParam = searchParams.get("type")?.trim() || "email";
  const next = safeNextPath(searchParams.get("next"));
  const origin = request.nextUrl.origin;
  const secret = tokenHash || token;

  const loginError = (detail: string) => {
    const q = new URLSearchParams({
      error: "auth",
      returnTo: next,
      detail: detail.slice(0, 160),
    });
    return NextResponse.redirect(`${origin}${PREP_BASE}/login?${q.toString()}`);
  };

  if (!secret) {
    return loginError("missing_token");
  }

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

  const typesToTry: EmailOtpType[] = [
    typeParam as EmailOtpType,
    "email",
    "magiclink",
    "signup",
  ];

  let lastMessage = "verify_failed";
  const seen = new Set<string>();

  for (const otpType of typesToTry) {
    if (seen.has(otpType)) continue;
    seen.add(otpType);

    const attempts = email
      ? [
          supabase.auth.verifyOtp({ email, token: secret, type: otpType }),
          supabase.auth.verifyOtp({ email, token_hash: secret, type: otpType }),
        ]
      : [
          supabase.auth.verifyOtp({ token_hash: secret, type: otpType }),
        ];

    for (const attempt of attempts) {
      const { error } = await attempt;
      if (!error) {
        return response;
      }
      lastMessage = error.message;
    }
  }

  console.error("[prep/auth/verify]", lastMessage);
  return loginError(lastMessage);
}
