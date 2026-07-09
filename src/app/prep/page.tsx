import type { Metadata } from "next";
import { PrepHomeView } from "@/components/prep/PrepHomeView";
import { JsonLdScript, organizationJsonLd } from "@/lib/prep/seo/json-ld";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: "PREPARE - הכנה לאמירנט ומבחני אנגלית אקדמיים",
  description:
    "PREPARE: קורסי הכנה דיגיטליים לאמירנט ולמבחני אנגלית אקדמיים. " +
    "תרגול אדפטיבי עם AI, שיעורים מובנים, וסימולציות מלאות בתנאי אמת.",
  keywords: [
    "הכנה לאמירנט",
    "אמירנט",
    "מבחן אנגלית אקדמי",
    "מאלו",
    "קורס אמירנט",
    "amirant",
    "prepare academy",
  ],
  alternates: { canonical: `${siteUrl}/prep` },
  openGraph: {
    title: "PREPARE - הכנה לאמירנט",
    description: "קורסי הכנה דיגיטליים לאמירנט. תרגול אדפטיבי עם AI, שיעורים מובנים, וסימולציות.",
    url: `${siteUrl}/prep`,
    locale: "he_IL",
    type: "website",
  },
};

export default function PrepHomePage() {
  return (
    <>
      <JsonLdScript data={organizationJsonLd(siteUrl)} />
      <PrepHomeView />
    </>
  );
}
