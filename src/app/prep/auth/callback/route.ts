import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/prep/amirant/course/dashboard";
  return next;
}

/** OAuth / magic-link code exchange for Supabase (PKCE). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/prep/login?error=missing_code`);
  }

  const supabase = createPrepSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/prep/login?error=missing_config`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/prep/login?error=auth`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
