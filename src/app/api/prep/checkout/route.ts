import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { PLAN_DAYS, PLAN_PRICES_NIS, PLAN_LABELS } from "@/lib/prep/pricing-plans";

const BodySchema = z.object({
  planId: z.string().min(1),
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

  let body: { planId: string };
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

  // ── HYP Payment ──────────────────────────────────────────────────────────
  // Set HYP_API_KEY + HYP_TERMINAL_NUMBER in Vercel env vars.
  // Webhook URL in HYP dashboard: https://getprepared.academy/api/prep/webhooks/hyp
  // ─────────────────────────────────────────────────────────────────────────
  const hypApiKey = process.env.HYP_API_KEY;
  const hypTerminal = process.env.HYP_TERMINAL_NUMBER;

  if (hypApiKey && hypTerminal) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://getprepared.academy";
      const hypRes = await fetch("https://api.hyp.co.il/api/v1/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${hypApiKey}` },
        body: JSON.stringify({
          terminal: hypTerminal,
          amount: priceNis * 100,
          currency: "ILS",
          description: PLAN_LABELS[planId],
          successUrl: `${baseUrl}/prep/amirant/course?checkout=success&plan=${planId}`,
          cancelUrl: `${baseUrl}/prep/pricing?checkout=cancel`,
          metadata: { userId: user.id, planId, days },
        }),
      });

      if (hypRes.ok) {
        const hypData = (await hypRes.json()) as { url?: string };
        if (hypData.url) return NextResponse.json({ url: hypData.url });
      }
    } catch {
      // fall through to dev mode
    }
  }

  // ── Dev / PREP_HAS_FULL_ACCESS mode: grant immediately ───────────────────
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PREP_HAS_FULL_ACCESS === "1") {
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

  return NextResponse.json({ error: "מערכת התשלום טרם הוגדרה. פנו לתמיכה." }, { status: 503 });
}
