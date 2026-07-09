import type { Metadata } from "next";
import { MarketingFooter } from "@/components/prep/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/prep/marketing/MarketingHeader";
import {
  PREP_BRAND_SUBTITLE_HE,
  PREP_BRAND_WORDMARK,
} from "@/lib/prep/brand";
import { JsonLdScript, organizationJsonLd } from "@/lib/prep/seo/json-ld";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { PrepUtmCapture } from "@/components/prep/PrepUtmCapture";
import { Suspense } from "react";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PREP_BRAND_WORDMARK} - ${PREP_BRAND_SUBTITLE_HE}`,
    template: `%s | ${PREP_BRAND_WORDMARK}`,
  },
  description: `${PREP_BRAND_SUBTITLE_HE} - קורסים דיגיטליים, תרגול חכם והכנה ממוקדת לאמירנט. TOEFL בקרוב.`,
  openGraph: {
    locale: "he_IL",
    type: "website",
    url: `${siteUrl}/prep`,
    // התמונה עצמה מגיעה מ-opengraph-image.tsx (1200×630, file convention)
  },
  alternates: { canonical: `${siteUrl}/prep` },
};

export default function PrepRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdScript data={organizationJsonLd(siteUrl)} />
      <Suspense fallback={null}>
        <PrepUtmCapture />
      </Suspense>
      <div dir="rtl" className="flex min-h-screen flex-col">
        <MarketingHeader />
        <main className="relative z-0 isolate min-w-0 flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </>
  );
}
