import type { Metadata } from "next";
import { PrepCourseCatalog } from "@/components/prep/catalog/PrepCourseCatalog";
import { PREP_BRAND_LATIN } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export const metadata: Metadata = {
  alternates: { canonical: `${getPublicSiteUrl()}/prep/courses` },
  title: `קורסים | ${PREP_BRAND_LATIN}`,
  description: "קטלוג הכנות למבחני אנגלית - אמירנט פעיל, TOEFL בקרוב.",
};

export default function PrepCoursesPage() {
  return (
    <PrepCourseCatalog
      showBreadcrumbs
      breadcrumbTrail={[{ label: "קורסים", href: `${PREP_BASE}/courses` }]}
    />
  );
}
