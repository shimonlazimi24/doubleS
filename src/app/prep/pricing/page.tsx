import type { Metadata } from "next";
import { Suspense } from "react";
import { PREP_BASE } from "@/lib/prep/constants";
import { PrepPricingPage } from "@/components/prep/PrepPricingPage";
import { Container, Heading, Text } from "@/components/ui";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.pricing;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `${siteUrl}/prep/pricing` },
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: "/prep/pricing" }),
};

export default function PricingRoutePage() {
  return (
    <div className="min-h-[70vh] bg-canvas">
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "הכנה לאמירנט", path: `${PREP_BASE}/amirant` },
          { name: "מחירים", path: `${PREP_BASE}/pricing` },
        ])}
      />
      <Container max="measure" className="py-10 md:py-14">
        <Heading level={1}>
          מחירים לקורס ההכנה לאמירנט
        </Heading>
        <Text as="p" variant="body" className="mt-2 text-muted">
          גישה מלאה לכל הקורס: מודולים, סימולציות ועוזר AI. בחרו לכמה זמן.
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
