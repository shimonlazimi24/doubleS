import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

async function requireAdmin() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isPrepAdminUser(user)) return null;
  return supabase;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { topic_slug, subtopic_slug, prompt, options, correct_option_id, explanation, difficulty, published } = body;

  const { error } = await supabase
    .from("cms_questions")
    .update({ topic_slug, subtopic_slug: subtopic_slug || null, prompt, options, correct_option_id, explanation: explanation || null, difficulty, published })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data, error } = await supabase
    .from("cms_questions")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) {
    return NextResponse.json({ error: "השאלה לא נמצאה או שאין הרשאה למחוק" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
