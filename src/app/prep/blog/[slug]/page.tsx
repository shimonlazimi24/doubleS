import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PREP_BASE, PREP_BRAND_LATIN } from "@/lib/prep/constants";
import { getBlogPost, listBlogPosts } from "@/lib/prep/blog.server";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { AMIRANT_COURSE_MD_COMPONENTS } from "@/components/prep/amirant-course/AmirantCourseMarkdownFromRepo";
import { Container, PageLayout, Text } from "@/components/ui";

const siteUrl = getPublicSiteUrl();

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return listBlogPosts().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: Params }): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  const url = `${siteUrl}${PREP_BASE}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      locale: "he_IL",
      type: "article",
      publishedTime: post.date,
    },
  };
}

function articleJsonLd(post: { slug: string; title: string; description: string; date: string }) {
  const url = `${siteUrl}${PREP_BASE}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "he",
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: PREP_BRAND_LATIN, url: `${siteUrl}${PREP_BASE}` },
    publisher: { "@type": "Organization", name: PREP_BRAND_LATIN, url: `${siteUrl}${PREP_BASE}` },
  };
}

function formatHeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

export default function PrepBlogPostPage({ params }: { params: Params }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <div className="bg-paper">
      <JsonLdScript data={articleJsonLd(post)} />
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "בלוג", path: `${PREP_BASE}/blog` },
          { name: post.title, path: `${PREP_BASE}/blog/${post.slug}` },
        ])}
      />
      <PageLayout pad="lg">
        <Container max="measure">
          <Link
            href={`${PREP_BASE}/blog`}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            כל המאמרים
          </Link>
          <article dir="rtl" lang="he" className="mt-6">
            <header>
              <Text as="p" variant="caption" className="text-muted">
                {formatHeDate(post.date)}
              </Text>
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {post.title}
              </h1>
              <Text as="p" variant="body" className="mt-3 max-w-readable text-muted">
                {post.description}
              </Text>
            </header>
            <div className="mt-8 border-t border-line/60 pt-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={AMIRANT_COURSE_MD_COMPONENTS}>
                {post.body}
              </ReactMarkdown>
            </div>
          </article>
          <div className="mt-12 rounded-2xl border border-line/70 bg-white p-6 text-center">
            <Text as="p" variant="body" className="font-semibold text-ink">
              רוצים לדעת מאיפה אתם מתחילים?
            </Text>
            <Text as="p" variant="bodySm" className="mt-1 text-muted">
              מבחן רמה קצר בחינם - ותוכנית הכנה שנבנית סביב התוצאה שלכם.
            </Text>
            <Link
              href={`${PREP_BASE}/amirant`}
              className="mt-4 inline-flex min-h-11 items-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              לקורס ההכנה לאמירנט
            </Link>
          </div>
        </Container>
      </PageLayout>
    </div>
  );
}
