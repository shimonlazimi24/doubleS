import type { Metadata } from "next";
import { MarketingFooter } from "@/components/prep/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/prep/marketing/MarketingHeader";
import {
  PREP_BRAND_SUBTITLE_HE,
  PREP_BRAND_WORDMARK,
} from "@/lib/prep/brand";
import { JsonLdScript, organizationJsonLd, websiteJsonLd } from "@/lib/prep/seo/json-ld";
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
    siteName: PREP_BRAND_WORDMARK,
    locale: "he_IL",
    type: "website",
    url: `${siteUrl}/prep`,
    // התמונה עצמה מגיעה מ-opengraph-image.tsx (1200×630, file convention)
  },
  // Twitter/X reads its own tags; without this block the card showed no title.
  twitter: { card: "summary_large_image" },
  // No canonical here on purpose: metadata in a layout is inherited by every
  // page beneath it, so this used to declare /prep/pricing, /prep/courses,
  // /prep/contact, /prep/terms and /prep/privacy as duplicates of /prep. Each
  // page sets its own.
};

export default function PrepRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdScript data={organizationJsonLd(siteUrl)} />
      <JsonLdScript data={websiteJsonLd(siteUrl)} />
      <Suspense fallback={null}>
        <PrepUtmCapture />
      </Suspense>
      <div dir="rtl" className="flex min-h-screen flex-col">
        {/* Skip link (WCAG 2.4.1): visually hidden until it receives keyboard focus;
            z above the sticky headers (z-[100]) so it is never covered. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-control focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lift"
        >
          דילוג לתוכן הראשי
        </a>
        <MarketingHeader />
        <main id="main" tabIndex={-1} className="relative z-0 isolate min-w-0 flex-1 outline-none">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </>
  );
}
