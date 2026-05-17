import { NextResponse, type NextRequest } from "next/server";
import { PREP_BASE } from "@/lib/prep/constants";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/prep/amirant/continue";
  return next;
}

/**
 * Legacy `/prep/auth/callback` links → client `/prep/auth/complete` (PKCE verifier in browser).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const next = safeNextPath(searchParams.get("next"));
  const origin = request.nextUrl.origin;

  const loginError = (error: string) =>
    NextResponse.redirect(
      `${origin}/prep/login?error=${error}&returnTo=${encodeURIComponent(next)}`,
    );

  if (code || tokenHash) {
    const complete = new URL(`${origin}${PREP_BASE}/auth/complete`);
    searchParams.forEach((value, key) => {
      complete.searchParams.set(key, value);
    });
    if (!complete.searchParams.has("next")) {
      complete.searchParams.set("next", next);
    }
    return NextResponse.redirect(complete.toString());
  }

  return loginError("missing_code");
}
