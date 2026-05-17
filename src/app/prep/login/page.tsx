import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PREP_BASE, PREP_PRODUCT_NAME } from "@/lib/prep/constants";
import { PrepLoginForm } from "@/components/prep/PrepLoginForm";
import { Container, Heading, PageLayout, Section, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "התחברות",
  description: "התחברות ל-prePare — שמירת התקדמות וקורס אמירנט.",
};

export default function PrepLoginPage() {
  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container max="measure">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            ← חזרה ל־{PREP_PRODUCT_NAME}
          </Link>
          <Heading level={1} className="mt-ds-6">
            התחברות
          </Heading>
          <Text as="p" variant="body" className="mt-3 text-muted">
            התחברו כדי לשמור התקדמות בין מכשירים, לראות דשבורד אישי ולגשת לתוכן בתשלום אחרי רכישה.
          </Text>
        </Container>
      </PageLayout>
      <Section tone="canvas" padding="loose" className="border-t border-line/80">
        <Container max="measure">
          <Suspense fallback={<Text as="p" variant="body">טוען…</Text>}>
            <PrepLoginForm />
          </Suspense>
        </Container>
      </Section>
    </div>
  );
}
