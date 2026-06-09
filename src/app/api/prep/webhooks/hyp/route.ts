/**
 * HYP payment webhook — called by HYP after successful payment.
 * Set webhook URL in HYP dashboard: https://getprepared.academy/api/prep/webhooks/hyp
 * Set HYP_WEBHOOK_SECRET in Vercel env vars.
 */
import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { PLAN_DAYS } from "@/lib/prep/pricing-plans";

type HypWebhookPayload = {
  event: string;
  transactionId: string;
  status: string;
  metadata?: {
    userId?: string;
    planId?: string;
    days?: number;
  };
};

export async function POST(req: Request) {
  const secret = process.env.HYP_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-hyp-signature");
    if (sig !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: HypWebhookPayload;
  try {
    payload = (await req.json()) as HypWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.status !== "success" && payload.event !== "payment.success") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { userId, planId } = payload.metadata ?? {};
  if (!userId || !planId) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const days = PLAN_DAYS[planId];
  if (!days) {
    return NextResponse.json({ error: "Unknown planId" }, { status: 400 });
  }

  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const isExtension = planId.startsWith("ext_");
  let endsAt: string;

  if (isExtension) {
    const { data: existing } = await client
      .from("course_entitlements")
      .select("ends_at")
      .eq("user_id", userId)
      .eq("course_slug", "amirant-preparation")
      .single();

    const base = existing?.ends_at
      ? Math.max(new Date(existing.ends_at as string).getTime(), Date.now())
      : Date.now();
    endsAt = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  } else {
    endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  await client.from("course_entitlements").upsert(
    {
      user_id: userId,
      course_slug: "amirant-preparation",
      access_type: "paid",
      starts_at: new Date().toISOString(),
      ends_at: endsAt,
    },
    { onConflict: "user_id,course_slug" },
  );

  return NextResponse.json({ ok: true });
}
