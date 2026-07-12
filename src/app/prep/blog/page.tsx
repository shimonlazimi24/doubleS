import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container, Heading, PageLayout, Text } from "@/components/ui";

/* עד שיש מאמרים אמיתיים: עמוד "בקרוב" כן, בלי רשימת פוסטים מדומה ובלי אינדוקס. */
export const metadata: Metadata = {
  title: "בלוג",
  description: "מאמרים על הכנה לאמירנט ופטור מאנגלית - בקרוב.",
  robots: { index: false, follow: false },
};

export default function PrepBlogIndexPage() {
  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container max="measure">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            ← חזרה לדף הבית
          </Link>
          <Heading level={1} className="mt-ds-6">
            בלוג
          </Heading>
          <Text as="p" variant="body" className="mt-3 max-w-readable text-muted">
            מאמרים ראשונים על הכנה לאמירנט, אסטרטגיות מבחן ופטור מאנגלית יעלו כאן בקרוב.
          </Text>
          <Link
            href={`${PREP_BASE}/amirant`}
            className="mt-8 inline-flex min-h-11 items-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            בינתיים - לקורס האמירנט ←
          </Link>
        </Container>
      </PageLayout>
    </div>
  );
}
