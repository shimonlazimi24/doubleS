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

export async function POST(req: Request) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { id, topic_slug, subtopic_slug, prompt, options, correct_option_id, explanation, difficulty, published } = body;

  if (!id?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "id ו-prompt הם שדות חובה" }, { status: 400 });
  }
  if (!Array.isArray(options) || options.length !== 4) {
    return NextResponse.json({ error: "נדרשות בדיוק 4 אפשרויות תשובה" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cms_questions")
    .insert({
      id: id.trim(),
      topic_slug,
      subtopic_slug: subtopic_slug || null,
      prompt,
      options,
      correct_option_id,
      explanation: explanation || null,
      difficulty: difficulty ?? 3,
      published: published ?? false,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
