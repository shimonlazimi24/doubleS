import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

async function requireAdmin() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.is_admin !== true) return null;
  return supabase;
}

export async function POST(req: Request) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { id, title, kind, module_id, body_markdown, video_url, estimated_minutes, sort_order, published } = body;

  if (!id?.trim() || !title?.trim()) {
    return NextResponse.json({ error: "id ו-title הם שדות חובה" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cms_lessons")
    .insert({
      id: id.trim(),
      title: title.trim(),
      kind: kind ?? "text",
      module_id: module_id || null,
      body_markdown: body_markdown ?? "",
      video_url: video_url || null,
      estimated_minutes: estimated_minutes ?? 10,
      sort_order: sort_order ?? 0,
      published: published ?? false,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
