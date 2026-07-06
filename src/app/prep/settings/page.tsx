import type { Metadata } from "next";
import { Container, Heading, PageLayout, Section } from "@/components/ui";
import { PrepSettingsClient } from "@/components/prep/PrepSettingsClient";
import { PrepSubscriptionCard, type SubscriptionInfo } from "@/components/prep/PrepSubscriptionCard";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getCourseEntitlement } from "@/lib/prep/entitlements";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";

export const metadata: Metadata = { title: "הגדרות" };

export const dynamic = "force-dynamic";

async function loadSubscription(): Promise<SubscriptionInfo> {
  const empty: SubscriptionInfo = { active: false, accessType: null, endsAt: null, payments: [] };
  const client = createPrepSupabaseServerClient();
  if (!client) return empty;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return empty;

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
  };
}

export default async function PrepSettingsPage() {
  const subscription = await loadSubscription();
  return (
    <PageLayout pad="lg">
      <Container max="measure">
        <Heading level={1}>הגדרות</Heading>
      </Container>
      <Section tone="canvas" padding="loose" className="border-t border-line/80 mt-6">
        <Container max="measure" className="space-y-8">
          <PrepSubscriptionCard subscription={subscription} />
          <PrepSettingsClient />
        </Container>
      </Section>
    </PageLayout>
  );
}
