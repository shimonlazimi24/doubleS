import type { Metadata } from "next";
import { PrepAmirantHub } from "@/components/prep/amirant-hub/PrepAmirantHub";
import { AMIRANT_COURSE_SYLLABUS_META } from "@/lib/prep/amirant-course-syllabus";
import { JsonLdScript, amirantCourseJsonLd, amirantFaqJsonLd, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: "הכנה לאמירנט - קורס דיגיטלי מלא",
  description:
    "קורס הכנה מקיף לאמירנט (מבחן האנגלית של מאל״ו). " +
    "תרגול אדפטיבי עם AI, " +
    `${AMIRANT_COURSE_SYLLABUS_META.shortNoteHe} ` +
    "סימולציות מלאות בתנאי אמת, ועוזר AI אישי לכל שאלה.",
  keywords: [
    "הכנה לאמירנט", "קורס אמירנט", "אמירנט אנגלית", "מבחן אמירנט",
    "sentence completion", "reading comprehension", "מאלו", "amirant",
  ],
  alternates: { canonical: `${siteUrl}/prep/amirant` },
  openGraph: {
    title: "הכנה לאמירנט - קורס דיגיטלי מלא",
    description: "תרגול אדפטיבי עם AI, שיעורים מובנים, וסימולציות מלאות. הכינו לאמירנט בחכמה.",
    url: `${siteUrl}/prep/amirant`,
    locale: "he_IL",
    type: "website",
  },
};

export default function AmirantHubPage() {
  return (
    <>
      <JsonLdScript data={amirantCourseJsonLd(siteUrl)} />
      <JsonLdScript data={amirantFaqJsonLd()} />
      <JsonLdScript data={breadcrumbJsonLd(siteUrl, [
        { name: "PREPARE", path: "/prep" },
        { name: "אמירנט", path: "/prep/amirant" },
      ])} />
      <PrepAmirantHub />
    </>
  );
}
