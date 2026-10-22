import type { Metadata } from "next";
import { PrepAmirantHub } from "@/components/prep/amirant-hub/PrepAmirantHub";
import { JsonLdScript, amirantCourseJsonLd, amirantFaqJsonLd, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.amirant;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: [
    "הכנה לאמירנט", "קורס אמירנט אונליין", "מבחן אמירנט", "אמירנט ציון עובר",
    "אמירנט 2026 רפורמה", "sentence completion", "reading comprehension", "מאלו", "amirant",
  ],
  alternates: { canonical: `${siteUrl}/prep/amirant` },
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: "/prep/amirant" }),
};

export default function AmirantHubPage() {
  return (
    <>
      <JsonLdScript data={amirantCourseJsonLd(siteUrl)} />
      <JsonLdScript data={amirantFaqJsonLd()} />
      <JsonLdScript data={breadcrumbJsonLd(siteUrl, [
        { name: "PREPARE", path: "/prep" },
        { name: "הכנה לאמירנט", path: "/prep/amirant" },
      ])} />
      <PrepAmirantHub />
    </>
  );
}
