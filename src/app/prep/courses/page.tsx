import type { Metadata } from "next";
import { PrepCourseCatalog } from "@/components/prep/catalog/PrepCourseCatalog";
import { PREP_BASE } from "@/lib/prep/constants";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.courses;

export const metadata: Metadata = {
  alternates: { canonical: `${siteUrl}/prep/courses` },
  // The layout template appends " | PREPARE"; spelling it here too doubled the brand.
  title: meta.title,
  description: meta.description,
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: "/prep/courses" }),
};

export default function PrepCoursesPage() {
  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "קורסים", path: `${PREP_BASE}/courses` },
        ])}
      />
      <PrepCourseCatalog
        showBreadcrumbs
        headingLevel={1}
        breadcrumbTrail={[{ label: "קורסים", href: `${PREP_BASE}/courses` }]}
      />
    </>
  );
}
