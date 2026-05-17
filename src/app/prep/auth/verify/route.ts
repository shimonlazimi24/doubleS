import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  verifyPrepAuthToken,
  verifyPrepAuthWithAdminLink,
} from "@/lib/prep/auth-verify-server";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";
import { PREP_BASE } from "@/lib/prep/constants";

export const dynamic = "force-dynamic";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/prep/amirant/continue";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash")?.trim();
  const token = searchParams.get("token")?.trim();
  const email = searchParams.get("email")?.trim();
  const typeParam = searchParams.get("type")?.trim() || "email";
  const next = safeNextPath(searchParams.get("next"));
  const origin = request.nextUrl.origin;
  const secret = token || tokenHash;

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

  const redirectTarget = `${origin}${next}`;
  let response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            path: options?.path ?? "/",
            sameSite: options?.sameSite ?? "lax",
            secure: options?.secure ?? process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });

  const verifyInput = {
    url: env.url,
    anonKey: env.anonKey,
    email,
    secret,
    typeParam,
  };

  let result = await verifyPrepAuthToken(supabase, verifyInput);

  if (!result.ok) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (serviceKey && email) {
      result = await verifyPrepAuthWithAdminLink(supabase, {
        ...verifyInput,
        serviceRoleKey: serviceKey,
        redirectTo: `${origin}${PREP_BASE}/auth/complete?next=${encodeURIComponent(next)}`,
      });
    }
  }

  if (!result.ok) {
    console.error("[prep/auth/verify]", result.message);
    return loginError(result.message);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("[prep/auth/verify] no session after verify", userError?.message);
    return loginError(userError?.message ?? "no_session");
  }

  return response;
}
