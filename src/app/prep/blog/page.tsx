import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { listBlogPosts } from "@/lib/prep/blog.server";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { Container, Heading, PageLayout, Text } from "@/components/ui";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: "בלוג - מדריכים להכנה לאמירנט",
  description:
    "מדריכים מעשיים לאמירנט: מבנה המבחן, סולם הציונים ופטור מאנגלית, רפורמת 2026 ואסטרטגיות הכנה.",
  alternates: { canonical: `${siteUrl}/prep/blog` },
  openGraph: {
    title: "בלוג PREPARE - מדריכים להכנה לאמירנט",
    description: "מבנה המבחן, ציונים ופטור מאנגלית, רפורמת 2026 ואסטרטגיות הכנה.",
    url: `${siteUrl}/prep/blog`,
    locale: "he_IL",
    type: "website",
  },
};

function formatHeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

export default function PrepBlogIndexPage() {
  const posts = listBlogPosts();
  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container max="measureWide">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            חזרה לדף הבית
          </Link>
          <Heading level={1} className="mt-ds-6">
            בלוג
          </Heading>
          <Text as="p" variant="body" className="mt-3 max-w-readable text-muted">
            מדריכים מעשיים להכנה לאמירנט - עם המספרים האמיתיים של המבחן.
          </Text>

          <ul className="mt-10 space-y-6" role="list">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`${PREP_BASE}/blog/${post.slug}`}
                  className="group block rounded-2xl border border-line/70 bg-white p-5 transition hover:border-primary/40 hover:shadow-card sm:p-6"
                >
                  <Text as="p" variant="caption" className="text-muted">
                    {formatHeDate(post.date)}
                  </Text>
                  <Heading
                    level={2}
                    className="mt-1.5 text-xl leading-snug transition group-hover:text-primary sm:text-2xl"
                  >
                    {post.title}
                  </Heading>
                  <Text as="p" variant="body" className="mt-2 max-w-readable text-muted">
                    {post.description}
                  </Text>
                  <span className="mt-3 inline-block text-sm font-semibold text-primary">לקריאה</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </PageLayout>
    </div>
  );
}
