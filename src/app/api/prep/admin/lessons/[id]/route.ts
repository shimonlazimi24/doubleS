import { NextResponse } from "next/server";
import { adminDbError, adminError, readJsonBody, requirePrepAdmin } from "@/lib/prep/admin-api.server";
import { COURSE_CATALOG } from "@/lib/prep/admin/course-catalog";
import { parseLessonPayload } from "@/lib/prep/admin/lesson-payload";

/**
 * Save the CMS override for one course lesson (insert or update).
 *
 * One upsert instead of select-then-insert/update: two admins saving the same
 * lesson at once could both see "missing", and the second insert failed.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requirePrepAdmin();
  if (!gate.ok) return gate.response;

  const body = await readJsonBody(req);
  if (body === undefined) return adminError("גוף הבקשה אינו JSON תקין", 400);

  const parsed = parseLessonPayload(params.id, body, COURSE_CATALOG);
  if (!parsed.ok) return adminError(parsed.error, 400);

  const { data, error } = await gate.supabase
    .from("cms_lessons")
    .upsert(parsed.row, { onConflict: "id" })
    .select("id")
    .single();

  if (error) return adminDbError("lessons", error);
  return NextResponse.json({ ok: true, id: data.id });
}

/** Removes the override; the lesson goes back to the text in the course files. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requirePrepAdmin();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.supabase
    .from("cms_lessons")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return adminDbError("lessons", error);
  if (!data?.length) return adminError("לשיעור הזה אין גרסה ערוכה למחיקה", 404);
  return NextResponse.json({ ok: true });
}
