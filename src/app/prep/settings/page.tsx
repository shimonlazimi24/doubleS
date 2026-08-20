import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Text } from "@/components/ui";
import { PrepSettingsClient } from "@/components/prep/PrepSettingsClient";
import { PrepSubscriptionCard, type SubscriptionInfo } from "@/components/prep/PrepSubscriptionCard";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getCourseEntitlement } from "@/lib/prep/entitlements";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";
import { PREP_BASE } from "@/lib/prep/constants";

export const metadata: Metadata = { title: "אזור אישי" };

export const dynamic = "force-dynamic";

type AccountInfo = {
  email: string | null;
  fullName: string | null;
};

async function loadAccountAndSubscription(): Promise<{
  account: AccountInfo;
  subscription: SubscriptionInfo;
}> {
  const empty: SubscriptionInfo = { active: false, accessType: null, endsAt: null, payments: [] };
  const noAccount: AccountInfo = { email: null, fullName: null };
  const client = createPrepSupabaseServerClient();
  if (!client) return { account: noAccount, subscription: empty };
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { account: noAccount, subscription: empty };

  const account: AccountInfo = {
    email: user.email ?? null,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
  };

  const [entitlement, paymentsRes, entRow] = await Promise.all([
    getCourseEntitlement(client, user.id, AMIRANT_PREPARATION_SLUG),
    client
      .from("prep_payments")
      .select("order_ref,plan_id,amount_nis,status,paid_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    client
      .from("course_entitlements")
      .select("ends_at")
      .eq("user_id", user.id)
      .eq("course_slug", AMIRANT_PREPARATION_SLUG)
      .maybeSingle(),
  ]);

  return {
    account,
    subscription: {
      active: entitlement?.active ?? false,
      accessType: entitlement?.accessType ?? null,
      endsAt: (entRow.data?.ends_at as string | null) ?? null,
      payments: (paymentsRes.data ?? []).map((p) => ({
        orderRef: p.order_ref as string,
        planId: p.plan_id as string,
        amountNis: Number(p.amount_nis),
        status: p.status as string,
        paidAt: (p.paid_at as string | null) ?? null,
      })),
    },
  };
}

export default async function PrepSettingsPage() {
  const { account, subscription } = await loadAccountAndSubscription();
  return (
    <div className="min-h-[60vh] bg-canvas">
      <Container max="measure" className="py-8 md:py-12">
        <Heading level={1}>אזור אישי</Heading>
        <Text as="p" variant="bodySm" className="mt-2">
          הפרטים, המנוי וההתקדמות שלכם - במקום אחד.
        </Text>

        <div className="mt-8 space-y-9">
          {/* פרטים אישיים - שורות הגדרה עם קווי הפרדה דקים */}
          <section>
            <h2 className="text-lg font-bold text-primary">פרטים אישיים</h2>
            {account.email ? (
              <dl className="mt-2 divide-y divide-line/60">
                {account.fullName ? (
                  <div className="grid grid-cols-[6rem_1fr] items-baseline gap-3 py-3">
                    <dt className="text-sm text-muted">שם</dt>
                    <dd className="text-sm font-medium text-ink">{account.fullName}</dd>
                  </div>
                ) : null}
                <div className="grid grid-cols-[6rem_1fr] items-baseline gap-3 py-3">
                  <dt className="text-sm text-muted">מייל</dt>
                  <dd className="text-sm font-medium text-ink" dir="ltr" style={{ textAlign: "left" }}>
                    {account.email}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="mt-3 space-y-2">
                <Text as="p" variant="bodySm">
                  לא זוהה חשבון מחובר.
                </Text>
                <Link
                  href={`${PREP_BASE}/login?next=${encodeURIComponent(`${PREP_BASE}/settings`)}`}
                  className="inline-flex text-sm font-semibold text-primary transition hover:text-primary-hover"
                >
                  התחברות
                </Link>
              </div>
            )}
          </section>

          {/* מנוי - שורה רזה אחת */}
          <PrepSubscriptionCard subscription={subscription} />

          {/* קיצורי דרך - שני קישורים שקטים, בלי מבוי סתום */}
          <section className="border-t border-line/70 pt-6">
            <h2 className="text-lg font-bold text-primary">קיצורי דרך</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-2">
              <Link
                href={`${PREP_BASE}/amirant/course`}
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary transition hover:text-primary-hover"
              >
                לקורס
              </Link>
              <Link
                href={`${PREP_BASE}/amirant/course/analytics`}
                className="inline-flex min-h-10 items-center text-sm font-semibold text-primary transition hover:text-primary-hover"
              >
                ההתקדמות שלי
              </Link>
            </div>
          </section>

          {/* ניהול חשבון - פעולות שקטות */}
          <PrepSettingsClient />
        </div>
      </Container>
    </div>
  );
}
