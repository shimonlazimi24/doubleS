import type { Metadata } from "next";
import { PrepCourseCatalog } from "@/components/prep/catalog/PrepCourseCatalog";
import { PREP_BRAND_LATIN } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";

export const metadata: Metadata = {
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
