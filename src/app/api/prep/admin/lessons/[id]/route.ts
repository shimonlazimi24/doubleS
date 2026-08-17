import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

async function requireAdmin() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPrepAdminUser(user)) return null;
  return supabase;
}

function lessonRowFromBody(body: Record<string, unknown>, id: string) {
  return {
    id,
    title: typeof body.title === "string" ? body.title.trim() : "",
    kind: body.kind ?? "text",
    module_id: body.module_id || null,
    body_markdown: body.body_markdown ?? "",
    video_url: body.video_url || null,
    estimated_minutes: body.estimated_minutes ?? 10,
    sort_order: body.sort_order ?? 0,
    published: body.published ?? false,
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const id = params.id;
  const row = lessonRowFromBody(body, id);
  if (!row.title) {
    return NextResponse.json({ error: "title הוא שדה חובה" }, { status: 400 });
  }

  const { data: existing, error: findError } = await supabase
    .from("cms_lessons")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });

  if (!existing) {
    const { data, error } = await supabase.from("cms_lessons").insert(row).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id, created: true });
  }

  const { data, error } = await supabase
    .from("cms_lessons")
    .update({
      title: row.title,
      kind: row.kind,
      module_id: row.module_id,
      body_markdown: row.body_markdown,
      video_url: row.video_url,
      estimated_minutes: row.estimated_minutes,
      sort_order: row.sort_order,
      published: row.published,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data, error } = await supabase
    .from("cms_lessons")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) {
    return NextResponse.json({ error: "השיעור לא נמצא או שאין הרשאה למחוק" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
