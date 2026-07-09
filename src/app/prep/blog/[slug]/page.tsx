import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container, Heading, PageLayout, Text } from "@/components/ui";

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const label = params.slug.replace(/-/g, " ");
  return { title: label };
}

export default function PrepBlogPostPage({ params }: Props) {
  const heading = params.slug.replace(/-/g, " ");

  return (
    <article className="bg-paper">
      <PageLayout pad="xl">
        <Container max="measure">
          <Link
            href={`${PREP_BASE}/blog`}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            ← חזרה לבלוג
          </Link>
          <header className="mt-ds-8">
            <Text as="p" variant="eyebrow">
              מאמר
            </Text>
            <Heading level={1} className="mt-ds-2">
              {heading}
            </Heading>
          </header>
          <div className="mt-ds-10 border-t border-line/80 pt-ds-8">
            <Text as="p" variant="bodyLg">
              טיוטה - יוחלף בתוכן מ־MDX, מערכת ניהול או ייצור סטטי כשתהליך עריכה יהיה מוכן.
            </Text>
          </div>
        </Container>
      </PageLayout>
    </article>
  );
}
