import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PREP_BASE, PREP_PRODUCT_NAME } from "@/lib/prep/constants";
import { PrepPricingPage } from "@/components/prep/PrepPricingPage";
import { Container, Heading, PageLayout, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "מחירים",
  description: "רכישת גישה מלאה לקורס Amirant Preparation.",
};

export default function PricingRoutePage() {
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
            מחירים
          </Heading>
        </Container>
      </PageLayout>
      <Section tone="canvas" padding="loose" className="border-t border-line/80">
        <Container max="measure">
          <Suspense fallback={<p className="text-sm text-muted">טוען…</p>}>
            <PrepPricingPage />
          </Suspense>
        </Container>
      </Section>
    </div>
  );
}
