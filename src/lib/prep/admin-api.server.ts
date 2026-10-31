import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

/**
 * The one admin gate for every `/api/prep/admin/*` route.
 *
 * The middleware matcher skips `/api`, so these routes are reachable by anyone
 * with a session (or none). Each route must call this before doing anything.
 * Admin is read from `app_metadata` only — see admin-auth.ts.
 *
 * Returns the caller's own session client: CMS writes then also pass through
 * row-level security, which checks the same flag a second time in Postgres.
 */
export type AdminGate =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse };

export async function requirePrepAdmin(): Promise<AdminGate> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) {
    return { ok: false, response: adminError("Supabase לא מוגדר בסביבה הזו.", 503) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: adminError("החיבור פג. התחברו מחדש.", 401) };
  }
  if (!isPrepAdminUser(user)) {
    return { ok: false, response: adminError("אין הרשאת אדמין לחשבון הזה.", 403) };
  }
  return { ok: true, supabase, user };
}

export function adminError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Database errors become a Hebrew sentence for the admin; the raw message goes
 * to the server log, where it is useful, instead of the screen, where it is not.
 */
export function adminDbError(scope: string, error: { code?: string; message: string }): NextResponse {
  // eslint-disable-next-line no-console -- server-side trace of a failed admin write
  console.error(`[admin/${scope}] ${error.code ?? "unknown"}: ${error.message}`);
  if (error.code === "23505") return adminError("כבר קיימת רשומה עם המזהה הזה.", 409);
  if (error.code === "42501") return adminError("מסד הנתונים דחה את הפעולה (הרשאות RLS).", 403);
  if (error.code === "42P01") return adminError("הטבלה לא קיימת במסד הנתונים. יש להריץ את קובץ ה-SQL שלה.", 500);
  return adminError("הפעולה נכשלה במסד הנתונים. נסו שוב.", 500);
}

export async function readJsonBody(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
