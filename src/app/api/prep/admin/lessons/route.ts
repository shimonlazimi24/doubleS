import { NextResponse } from "next/server";
import { adminDbError, adminError, readJsonBody, requirePrepAdmin } from "@/lib/prep/admin-api.server";
import { COURSE_CATALOG } from "@/lib/prep/admin/course-catalog";
import { parseLessonPayload } from "@/lib/prep/admin/lesson-payload";

/** First save of an override for a course lesson. Ids outside the manifest are refused. */
export async function POST(req: Request) {
  const gate = await requirePrepAdmin();
  if (!gate.ok) return gate.response;

  const body = await readJsonBody(req);
  if (typeof body !== "object" || body === null) {
    return adminError("גוף הבקשה אינו JSON תקין", 400);
  }
  const rawId = (body as { id?: unknown }).id;
  const parsed = parseLessonPayload(typeof rawId === "string" ? rawId : "", body, COURSE_CATALOG);
  if (!parsed.ok) return adminError(parsed.error, 400);

  const { data, error } = await gate.supabase
    .from("cms_lessons")
    .insert(parsed.row)
    .select("id")
    .single();

  if (error) return adminDbError("lessons", error);
  return NextResponse.json({ id: data.id });
}
