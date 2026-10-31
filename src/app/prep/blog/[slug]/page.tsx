import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { PREP_BASE } from "@/lib/prep/constants";
import { getBlogPost, listBlogPosts } from "@/lib/prep/blog.server";
import { blogReadingMinutes, blogTopicOf } from "@/lib/prep/blog-meta";
import { formatHeDate } from "@/lib/prep/format-he-date";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { JsonLdScript, articleJsonLd, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { AMIRANT_COURSE_MD_COMPONENTS } from "@/components/prep/amirant-course/AmirantCourseMarkdownFromRepo";
import { ButtonLink, Container, PageLayout } from "@/components/ui";

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
    openGraph: prepOpenGraph(
      siteUrl,
      { title: post.title, description: post.description, path: `${PREP_BASE}/blog/${post.slug}` },
      { publishedTime: post.date, modifiedTime: post.updated, section: "הכנה לאמירנט", tags: post.keywords },
    ),
  };
}

/**
 * The course map shifts every markdown heading one level down (its h1 is the
 * lesson title). A post's title is the page h1 and its body starts at "##", so
 * here "##" stays an h2 - otherwise the outline jumped h1 -> h3 (WCAG 1.3.1).
 */
const BLOG_MD_COMPONENTS: Components = {
  ...AMIRANT_COURSE_MD_COMPONENTS,
  h2: ({ children }) => (
    <h2 className="mb-3 mt-10 border-b border-line/60 pb-2 text-2xl font-bold text-ink first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-semibold text-ink first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-4 text-lg font-semibold text-ink">{children}</h4>,
};

export default function PrepBlogPostPage({ params }: { params: Params }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const topic = blogTopicOf(post.slug);
  const siblings = listBlogPosts()
    .filter((p) => p.slug !== post.slug && blogTopicOf(p.slug).id === topic.id)
    .slice(0, 3);

  return (
    <div className="bg-paper">
      <JsonLdScript
        data={articleJsonLd(siteUrl, {
          path: `${PREP_BASE}/blog/${post.slug}`,
          title: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.updated,
          keywords: post.keywords,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "מדריכים", path: `${PREP_BASE}/blog` },
          { name: post.title, path: `${PREP_BASE}/blog/${post.slug}` },
        ])}
      />
      <PageLayout pad="lg">
        <Container max="measure">
          <Link href={`${PREP_BASE}/blog`} className="text-sm font-semibold text-primary transition hover:text-primary-hover">
            מדריכים
          </Link>
          <article dir="rtl" lang="he" className="mt-6">
            <header>
              <p className="text-sm tabular-nums text-muted-2">
                <time dateTime={post.date}>{formatHeDate(post.date)}</time>
                {post.updated && post.updated !== post.date ? (
                  <>
                    <span aria-hidden> · </span>
                    עודכן <time dateTime={post.updated}>{formatHeDate(post.updated)}</time>
                  </>
                ) : null}
                <span aria-hidden> · </span>
                {blogReadingMinutes(post.body)} דקות קריאה
              </p>
              <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.15] tracking-tight text-ink md:text-[2.5rem]">
                {post.title}
              </h1>
              <p className="mt-4 max-w-readable text-lg leading-relaxed text-muted">{post.description}</p>
            </header>
            <div className="mt-8 border-t border-line pt-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={BLOG_MD_COMPONENTS}>
                {post.body}
              </ReactMarkdown>
            </div>
          </article>

          {siblings.length ? (
            <nav aria-labelledby="more-guides" className="mt-14">
              <h2 id="more-guides" className="text-[15px] font-bold text-muted">
                עוד ב{topic.titleHe}
              </h2>
              <ul className="mt-3 border-t border-line" role="list">
                {siblings.map((p) => (
                  <li key={p.slug} className="border-b border-line">
                    <Link href={`${PREP_BASE}/blog/${p.slug}`} className="group block py-4">
                      <p className="text-[1.1rem] font-bold leading-snug text-ink transition group-hover:text-primary">{p.title}</p>
                      <p className="mt-1 text-[15px] leading-relaxed text-muted">{p.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </Container>
      </PageLayout>

      <section className="bg-primary py-16 text-white md:py-20">
        <Container max="measure" className="text-center">
          <h2 className="text-[1.75rem] font-black leading-[1.12] tracking-tight md:text-[2.2rem]">רוצים לדעת מאיפה אתם מתחילים?</h2>
          <p className="mx-auto mt-3 max-w-[34rem] text-lg leading-relaxed text-white/80">
            מבחן רמה קצר בחינם, ותוכנית הכנה שנבנית סביב התוצאה.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink
              href={`${PREP_BASE}/amirant`}
              variant="primary"
              className="min-h-[3.25rem] !rounded !bg-white px-7 text-[16px] font-extrabold !text-primary hover:!bg-white/90"
            >
              לקורס ההכנה לאמירנט
            </ButtonLink>
            <ButtonLink
              href={`${PREP_BASE}/amirant/sample-questions`}
              variant="secondary"
              className="min-h-[3.25rem] !rounded !border-white/55 !bg-transparent px-7 text-[16px] !text-white hover:!bg-white/10"
            >
              שאלות לדוגמה
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}
