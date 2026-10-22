import type { Metadata } from "next";
import { PrepHomeView } from "@/components/prep/PrepHomeView";
import { PREP_PAGE_META } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.home;

export const metadata: Metadata = {
  // The brand is already in the title, so opt out of the layout's " | PREPARE"
  // template - it used to render the name twice.
  title: { absolute: meta.title },
  description: meta.description,
  keywords: [
    "הכנה לאמירנט",
    "אמירנט",
    "קורס אמירנט אונליין",
    "מבחן אנגלית אקדמי",
    "מאלו",
    "amirant",
    "prepare academy",
  ],
  alternates: { canonical: `${siteUrl}/prep` },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: `${siteUrl}/prep`,
    locale: "he_IL",
    type: "website",
  },
};

export default function PrepHomePage() {
  // Organization JSON-LD מוזרק פעם אחת ב-layout - כפילות כאן יצרה שני בלוקים זהים בעמוד.
  return <PrepHomeView />;
}
