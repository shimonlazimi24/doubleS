import { NextResponse } from "next/server";
import { adminDbError, adminError, readJsonBody, requirePrepAdmin } from "@/lib/prep/admin-api.server";
import { parseQuestionId, parseQuestionPayload } from "@/lib/prep/admin/question-payload";

export async function POST(req: Request) {
  const gate = await requirePrepAdmin();
  if (!gate.ok) return gate.response;

  const body = await readJsonBody(req);
  if (typeof body !== "object" || body === null) return adminError("גוף הבקשה אינו JSON תקין", 400);

  const id = parseQuestionId((body as { id?: unknown }).id);
  if (!id) return adminError("מזהה לא תקין: אותיות לטיניות קטנות, ספרות, נקודה או מקף", 400);

  const parsed = parseQuestionPayload(body);
  if (!parsed.ok) return adminError(parsed.error, 400);

  const { data, error } = await gate.supabase
    .from("cms_questions")
    .insert({ id, ...parsed.row })
    .select("id")
    .single();

  if (error) return adminDbError("questions", error);
  return NextResponse.json({ id: data.id });
}
