import type { Metadata } from "next";
import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { PLAN_LABELS } from "@/lib/prep/pricing-plans";
import { PREP_BASE } from "@/lib/prep/constants";
import { formatDateHe } from "@/lib/prep/format-date-he";
import { Container, Text } from "@/components/ui";
import { PrepPurchaseTracker } from "@/components/prep/PrepPurchaseTracker";
import { CheckoutSuccessContinueLink } from "@/components/prep/CheckoutSuccessContinueLink";

export const metadata: Metadata = {
  title: "התשלום התקבל",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type PaymentRow = {
  order_ref: string;
  plan_id: string;
  amount_nis: number;
  status: string;
  hyp_transaction_id: string | null;
  entitlement_ends_at: string | null;
  paid_at: string | null;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; grant?: string };
}) {
  const orderRef = searchParams.order ?? null;
  let payment: PaymentRow | null = null;

  const client = createPrepSupabaseServerClient();
  if (client && orderRef) {
    const { data } = await client
      .from("prep_payments")
      .select("order_ref,plan_id,amount_nis,status,hyp_transaction_id,entitlement_ends_at,paid_at")
      .eq("order_ref", orderRef)
      .maybeSingle();
    payment = (data as PaymentRow | null) ?? null;
  }

  const stillPending = payment?.status === "pending";

  return (
    <Container max="measure" className="py-12" dir="rtl">
      {payment && payment.status === "paid" ? (
        <PrepPurchaseTracker
          orderRef={payment.order_ref}
          planId={payment.plan_id}
          amountNis={Number(payment.amount_nis)}
        />
      ) : null}
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink">התשלום התקבל בהצלחה!</h1>
          <Text as="p" variant="body" className="mt-2 text-muted">
            {stillPending
              ? "התשלום בעיבוד - הגישה תיפתח תוך רגעים. אם הדף לא מתעדכן, רעננו."
              : "הגישה לקורס נפתחה. אפשר להתחיל ללמוד עכשיו."}
          </Text>
        </div>

        {payment ? (
          <div className="rounded-2xl border border-line/80 bg-paper p-6">
            <Text as="p" variant="labelAccent" className="text-primary">
              פרטי הרכישה
            </Text>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">תוכנית</dt>
                <dd className="font-semibold text-ink">{PLAN_LABELS[payment.plan_id] ?? payment.plan_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">סכום</dt>
                <dd className="font-semibold text-ink">₪{Number(payment.amount_nis).toFixed(0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">גישה בתוקף עד</dt>
                <dd className="font-semibold text-ink">{formatDateHe(payment.entitlement_ends_at)}</dd>
              </div>
              {payment.hyp_transaction_id ? (
                <div className="flex justify-between">
                  <dt className="text-muted">מזהה עסקה</dt>
                  <dd className="font-mono text-xs text-muted" translate="no">
                    {payment.hyp_transaction_id}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <CheckoutSuccessContinueLink />
          <Link
            href={`${PREP_BASE}/settings`}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-6 text-sm font-semibold text-primary"
          >
            המנוי שלי
          </Link>
        </div>

        <Text as="p" variant="bodySm" className="text-center text-muted">
          קבלה נשלחת למייל. שאלות?{" "}
          <a href="mailto:support@getprepared.academy" className="underline">
            support@getprepared.academy
          </a>
        </Text>
      </div>
    </Container>
  );
}
