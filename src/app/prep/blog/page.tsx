import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE, PREP_PRODUCT_NAME } from "@/lib/prep/constants";
import { Container, Heading, PageLayout, Section, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "בלוג",
  description: `בלוג ${PREP_PRODUCT_NAME} — מאמרים על הכנה לאמירנט ולימודים בארה״ב.`,
};

const PLACEHOLDER_POSTS = [
  { slug: "welcome", title: "ברוכים הבאים ל-prePare" },
  { slug: "amirant-tips", title: "טיפים למבחן אמירנט" },
];

export default function PrepBlogIndexPage() {
  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container max="measure">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            ← חזרה ל־{PREP_PRODUCT_NAME}
          </Link>
          <Heading level={1} className="mt-ds-6">
            בלוג
          </Heading>
          <Text as="p" variant="body" className="mt-3 text-muted">
            מאמרים בדרך — בינתיים רשימת כותרות לדוגמה.
          </Text>
        </Container>
      </PageLayout>
      <Section tone="canvas" padding="loose" className="border-t border-line/80">
        <Container max="measure">
          <ul className="space-y-3">
            {PLACEHOLDER_POSTS.map((post) => (
              <li key={post.slug}>
                <Link href={`${PREP_BASE}/blog/${post.slug}`} className="text-primary font-medium hover:underline">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </div>
  );
}
