import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PREP_BASE, PREP_PRODUCT_NAME } from "@/lib/prep/constants";
import { PrepPricingPage } from "@/components/prep/PrepPricingPage";
import { Container, Heading, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "מחירים",
  description: "רכישת גישה מלאה לקורס ההכנה לאמירנט.",
};

export default function PricingRoutePage() {
  return (
    <div className="min-h-[70vh] bg-canvas">
      <Container max="measure" className="py-10 md:py-14">
        <Link
          href={PREP_BASE}
          className="text-xs font-semibold tracking-[0.14em] text-accent transition hover:text-primary"
        >
          ← חזרה ל־{PREP_PRODUCT_NAME}
        </Link>
        <Heading level={1} className="mt-5">
          בחרו תוכנית
        </Heading>
        <Text as="p" variant="body" className="mt-2 text-muted">
          גישה מלאה לכל הקורס - מודולים, סימולציות ועוזר AI. בחרו את משך הזמן שמתאים לכם.
        </Text>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-muted">טוען…</p>}>
            <PrepPricingPage />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
