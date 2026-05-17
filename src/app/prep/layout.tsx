import type { Metadata } from "next";
import { MarketingFooter } from "@/components/prep/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/prep/marketing/MarketingHeader";
import { PREP_BRAND_LATIN, PREP_BRAND_NAV_HE, PREP_LOGO_PATH } from "@/lib/prep/brand";
import { JsonLdScript, organizationJsonLd } from "@/lib/prep/seo/json-ld";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PREP_BRAND_LATIN} — ${PREP_BRAND_NAV_HE}`,
    template: `%s | ${PREP_BRAND_LATIN}`,
  },
  description: `${PREP_BRAND_NAV_HE} — קורסים דיגיטליים, תרגול חכם והכנה ממוקדת לאמירנט. TOEFL בקרוב.`,
  openGraph: {
    locale: "he_IL",
    type: "website",
    url: `${siteUrl}/prep`,
    images: [{ url: PREP_LOGO_PATH, alt: PREP_BRAND_LATIN }],
  },
  icons: { icon: PREP_LOGO_PATH, apple: PREP_LOGO_PATH },
  alternates: { canonical: `${siteUrl}/prep` },
};

export default function PrepRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdScript data={organizationJsonLd(siteUrl)} />
      <div className="flex min-h-screen flex-col">
        <MarketingHeader />
        <main className="relative z-0 isolate min-w-0 flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </>
  );
}
