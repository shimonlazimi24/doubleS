import type { Metadata } from "next";
import { PrepFooter } from "@/components/prep/PrepFooter";
import { PrepNav } from "@/components/prep/PrepNav";
import { PREP_BRAND_LATIN, PREP_BRAND_NAV_HE } from "@/lib/prep/brand";
import { JsonLdScript, organizationJsonLd } from "@/lib/prep/seo/json-ld";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PREP_BRAND_LATIN} — ${PREP_BRAND_NAV_HE}`,
    template: `%s | ${PREP_BRAND_LATIN}`,
  },
  description: `${PREP_BRAND_LATIN}: ${PREP_BRAND_NAV_HE} — אמירנט פעיל, TOEFL בקרוב.`,
  openGraph: { locale: "he_IL", type: "website", url: `${siteUrl}/prep` },
  alternates: { canonical: `${siteUrl}/prep` },
};

export default function PrepRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdScript data={organizationJsonLd(siteUrl)} />
      <div className="flex min-h-screen flex-col">
        <PrepNav />
        <main className="relative z-0 isolate min-w-0 flex-1">{children}</main>
        <PrepFooter />
      </div>
    </>
  );
}
