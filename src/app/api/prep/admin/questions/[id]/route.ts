import { NextResponse } from "next/server";
import { adminDbError, adminError, readJsonBody, requirePrepAdmin } from "@/lib/prep/admin-api.server";
import { parseQuestionPayload } from "@/lib/prep/admin/question-payload";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requirePrepAdmin();
  if (!gate.ok) return gate.response;

  const body = await readJsonBody(req);
  if (body === undefined) return adminError("גוף הבקשה אינו JSON תקין", 400);

  const parsed = parseQuestionPayload(body);
  if (!parsed.ok) return adminError(parsed.error, 400);

  const { data, error } = await gate.supabase
    .from("cms_questions")
    .update(parsed.row)
    .eq("id", params.id)
    .select("id");

  if (error) return adminDbError("questions", error);
  if (!data?.length) return adminError("השאלה לא נמצאה", 404);
  return NextResponse.json({ ok: true, id: params.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requirePrepAdmin();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.supabase
    .from("cms_questions")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return adminDbError("questions", error);
  if (!data?.length) return adminError("השאלה לא נמצאה", 404);
  return NextResponse.json({ ok: true });
}
