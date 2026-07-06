/**
 * יצירת תשלום — Hyp (Yaad Sarig).
 *
 * זרימה: משתמש מחובר בוחר תוכנית → נוצרת רשומת `prep_payments` במצב pending
 * (order_ref אקראי) → נבנה URL חתום לדף התשלום של Hyp → הלקוח מופנה לשם.
 * ההענקה עצמה קורית רק ב-callback המאומת (/api/prep/checkout/callback).
 *
 * הגדרות נדרשות בפורטל Hyp: כתובת הצלחה/שגיאה =
 * https://getprepared.academy/api/prep/checkout/callback
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { PLAN_DAYS, PLAN_PRICES_NIS, PLAN_LABELS } from "@/lib/prep/pricing-plans";
import { createHypPaymentUrl, isHypConfigured } from "@/lib/prep/hyp";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";

const BodySchema = z.object({
  planId: z.string().min(1),
  utm: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר לפני הרכישה" }, { status: 401 });
  }

  // מניעת הצפת רשומות pending
  const underLimit = await checkAiRouteRateLimit({
    key: `u:${user.id}`,
    route: "checkout",
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!underLimit) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסו שוב בעוד דקה." }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "planId חסר" }, { status: 400 });
  }

  const { planId } = body;
  const priceNis = PLAN_PRICES_NIS[planId];
  const days = PLAN_DAYS[planId];
  if (!priceNis || !days) {
    return NextResponse.json({ error: `תוכנית לא מוכרת: ${planId}` }, { status: 400 });
  }

  // ── Dev-only fake checkout (PREP_DEV_FAKE_CHECKOUT=1, never in production) ──
  if (process.env.NODE_ENV !== "production" && process.env.PREP_DEV_FAKE_CHECKOUT === "1") {
    const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await client.from("course_entitlements").upsert(
      {
        user_id: user.id,
        course_slug: "amirant-preparation",
        access_type: "paid",
        starts_at: new Date().toISOString(),
        ends_at: endsAt,
      },
      { onConflict: "user_id,course_slug" },
    );
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return NextResponse.json({ url: `${baseUrl}/prep/amirant/course?checkout=success&plan=${planId}` });
  }

  if (!isHypConfigured()) {
    return NextResponse.json({ error: "מערכת התשלום טרם הוגדרה. פנו לתמיכה." }, { status: 503 });
  }

  const service = getPrepSupabaseServiceClient();
  if (!service) {
    return NextResponse.json({ error: "מערכת התשלום אינה זמינה כרגע." }, { status: 500 });
  }

  const orderRef = crypto.randomUUID();
  const { error: insertError } = await service.from("prep_payments").insert({
    order_ref: orderRef,
    user_id: user.id,
    plan_id: planId,
    amount_nis: priceNis,
    status: "pending",
    utm: body.utm ?? null,
  });
  if (insertError) {
    return NextResponse.json({ error: "שגיאה ביצירת התשלום. נסו שוב." }, { status: 500 });
  }

  try {
    const clientName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined);
    const url = await createHypPaymentUrl({
      orderRef,
      amountNis: priceNis,
      description: PLAN_LABELS[planId] ?? planId,
      clientName,
      email: user.email ?? undefined,
    });
    return NextResponse.json({ url });
  } catch {
    await service
      .from("prep_payments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("order_ref", orderRef)
      .eq("status", "pending");
    return NextResponse.json({ error: "לא ניתן לפתוח דף תשלום כרגע. נסו שוב בעוד רגע." }, { status: 502 });
  }
}
