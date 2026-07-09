/**
 * קולבק תשלום מ-Hyp - היעד של "כתובת הצלחה/שגיאה" בפורטל Hyp.
 *
 * אבטחה: שום דבר לא נכתב לפני `verifyHypCallback` (HMAC / roundtrip VERIFY).
 * אידמפוטנטיות: ההענקה קורית רק במעבר pending→paid (update מותנה) - קולבק כפול
 * או ריענון של דף ההצלחה לא מעניקים פעמיים.
 * זהות: user/plan נטענים מרשומת prep_payments לפי Order - לא מהפרמטרים בכתובת.
 */
import { NextResponse } from "next/server";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { PLAN_DAYS } from "@/lib/prep/pricing-plans";
import { verifyHypCallback } from "@/lib/prep/hyp";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";

function siteUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(req.url).origin;
}

function redirectTo(req: Request, path: string): NextResponse {
  return NextResponse.redirect(`${siteUrl(req)}${path}`, { status: 303 });
}

async function handleCallback(req: Request, searchParams: URLSearchParams) {
  const service = getPrepSupabaseServiceClient();
  if (!service) {
    return { redirect: `/prep/checkout/failure?reason=server`, ok: false };
  }

  // האימות (שעשוי לכלול roundtrip ל-Hyp) ושליפת התשלום בלתי-תלויים - במקביל.
  // הקריאה היא read בלבד; שום כתיבה לא קורית לפני verification.ok.
  const rawOrderRef = searchParams.get("Order");
  const [verification, paymentRes] = await Promise.all([
    verifyHypCallback(searchParams),
    rawOrderRef
      ? service
          .from("prep_payments")
          .select("order_ref,user_id,plan_id,amount_nis,status")
          .eq("order_ref", rawOrderRef)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const orderRef = verification.orderRef;
  const payment = paymentRes.data;

  if (!verification.ok) {
    return { redirect: `/prep/checkout/failure?reason=verify`, ok: false };
  }
  if (!orderRef) {
    return { redirect: `/prep/checkout/failure?reason=order`, ok: false };
  }
  if (!payment) {
    return { redirect: `/prep/checkout/failure?reason=order&order=${orderRef}`, ok: false };
  }

  // עסקה שנכשלה בצד Hyp (CCode != 0)
  if (verification.ccode !== "0") {
    await service
      .from("prep_payments")
      .update({
        status: "failed",
        hyp_transaction_id: verification.transactionId,
        hyp_ccode: verification.ccode,
        raw_callback: verification.raw,
        updated_at: new Date().toISOString(),
      })
      .eq("order_ref", orderRef)
      .eq("status", "pending");
    return {
      redirect: `/prep/checkout/failure?order=${orderRef}&code=${encodeURIComponent(verification.ccode ?? "")}`,
      ok: false,
    };
  }

  // אימות סכום - אי-התאמה נרשמת ולא מוענקת
  const expected = Number(payment.amount_nis);
  if (verification.amountNis == null || Math.abs(verification.amountNis - expected) > 0.01) {
    await service
      .from("prep_payments")
      .update({
        status: "failed",
        hyp_transaction_id: verification.transactionId,
        hyp_ccode: verification.ccode,
        raw_callback: { ...verification.raw, _mismatch: "amount" },
        updated_at: new Date().toISOString(),
      })
      .eq("order_ref", orderRef)
      .eq("status", "pending");
    return { redirect: `/prep/checkout/failure?reason=amount&order=${orderRef}`, ok: false };
  }

  const days = PLAN_DAYS[payment.plan_id as string];
  if (!days) {
    return { redirect: `/prep/checkout/failure?reason=plan&order=${orderRef}`, ok: false };
  }

  // מעבר אטומי pending→paid; 0 שורות = כבר טופל (קולבק כפול) - הצלחה אידמפוטנטית
  const { data: transitioned } = await service
    .from("prep_payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      hyp_transaction_id: verification.transactionId,
      hyp_acode: verification.acode,
      hyp_ccode: verification.ccode,
      raw_callback: verification.raw,
      updated_at: new Date().toISOString(),
    })
    .eq("order_ref", orderRef)
    .eq("status", "pending")
    .select("order_ref");

  if (transitioned && transitioned.length > 0) {
    // הענקה אטומית ב-DB (grant_course_days) - שני קולבקים מקבילים מצטברים
    // במקום שהאחרון ידרוס. fallback ל-read-then-upsert אם הפונקציה חסרה.
    let endsAt: string | null = null;
    const { data: grantedEndsAt, error: rpcError } = await service.rpc("grant_course_days", {
      p_user_id: payment.user_id,
      p_course_slug: AMIRANT_PREPARATION_SLUG,
      p_days: days,
    });
    if (!rpcError && grantedEndsAt) {
      endsAt = grantedEndsAt as string;
    } else {
      const { data: existing } = await service
        .from("course_entitlements")
        .select("ends_at")
        .eq("user_id", payment.user_id)
        .eq("course_slug", AMIRANT_PREPARATION_SLUG)
        .maybeSingle();
      const baseMs = existing?.ends_at
        ? Math.max(new Date(existing.ends_at as string).getTime(), Date.now())
        : Date.now();
      endsAt = new Date(baseMs + days * 24 * 60 * 60 * 1000).toISOString();
      const { error: grantError } = await service.from("course_entitlements").upsert(
        {
          user_id: payment.user_id,
          course_slug: AMIRANT_PREPARATION_SLUG,
          access_type: "paid",
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
        },
        { onConflict: "user_id,course_slug" },
      );
      if (grantError) {
        // התשלום נרשם אך ההענקה נכשלה - דף ההצלחה מציג פנייה לתמיכה
        return { redirect: `/prep/checkout/success?order=${orderRef}&grant=retry`, ok: true };
      }
    }
    await service
      .from("prep_payments")
      .update({ entitlement_ends_at: endsAt, updated_at: new Date().toISOString() })
      .eq("order_ref", orderRef);
  }

  return { redirect: `/prep/checkout/success?order=${orderRef}`, ok: true };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const result = await handleCallback(req, searchParams);
  return redirectTo(req, result.redirect);
}

/** נוטיפיקציית שרת (אם מוגדרת בפורטל) - אותה לוגיקה, תשובת JSON. */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let params: URLSearchParams;
  if (contentType.includes("application/x-www-form-urlencoded")) {
    params = new URLSearchParams(await req.text());
  } else {
    params = new URL(req.url).searchParams;
  }
  const result = await handleCallback(req, params);
  return NextResponse.json({ ok: result.ok });
}
