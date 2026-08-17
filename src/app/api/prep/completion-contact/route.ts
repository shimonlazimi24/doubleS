import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(320),
  phone: z.string().max(30).nullable().optional(),
  course: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const { requestIp } = getAiRequestMeta(req);
  if (
    !(await checkAiRouteRateLimit({
      key: `i:${requestIp}`,
      route: "completion-contact",
      maxRequests: 5,
      windowMs: 10 * 60_000,
    }))
  ) {
    return NextResponse.json({ error: "יותר מדי פניות. נסו שוב מאוחר יותר." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 422 });
  }

  const { name, email, phone, course } = parsed.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "השירות לא זמין" }, { status: 503 });
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/completion_contacts`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ name, email, phone: phone ?? null, course: course ?? null }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "שמירה נכשלה" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
