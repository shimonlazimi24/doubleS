import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

async function requireAdmin() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.is_admin !== true) return null;
  return supabase;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { title, kind, module_id, body_markdown, video_url, estimated_minutes, sort_order, published } = body;

  const { error } = await supabase
    .from("cms_lessons")
    .update({
      title: title?.trim(),
      kind,
      module_id: module_id || null,
      body_markdown: body_markdown ?? "",
      video_url: video_url || null,
      estimated_minutes,
      sort_order,
      published,
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { error } = await supabase.from("cms_lessons").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
