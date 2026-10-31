import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { listBlogPosts, type BlogPost } from "@/lib/prep/blog.server";
import { BLOG_TOPICS, BLOG_TOPIC_OTHER, blogReadingMinutes, blogTopicOf } from "@/lib/prep/blog-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { Container, PageLayout } from "@/components/ui";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { formatHeDate } from "@/lib/prep/format-he-date";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.blog;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `${siteUrl}/prep/blog` },
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: "/prep/blog" }),
};

/** Posts in the hub's topic order; a post no topic names still shows, under "עוד מדריכים". */
function groupByTopic(posts: readonly BlogPost[]) {
  const groups = [...BLOG_TOPICS, BLOG_TOPIC_OTHER].map((topic) => ({
    topic,
    // Inside a topic the order is the reading order the topic lists, not the date.
    posts: posts
      .filter((p) => blogTopicOf(p.slug).id === topic.id)
      .sort((a, b) => topic.slugs.indexOf(a.slug) - topic.slugs.indexOf(b.slug)),
  }));
  return groups.filter((g) => g.posts.length > 0);
}

/**
 * The guides hub as a typographic list: one line of meta (date, reading
 * time), the title, one line of description. Hairlines separate posts;
 * topic headings separate groups. Nothing is boxed.
 */
export default function PrepBlogIndexPage() {
  const groups = groupByTopic(listBlogPosts());
  return (
    <div className="bg-paper">
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "מדריכים", path: `${PREP_BASE}/blog` },
        ])}
      />
      <PageLayout pad="lg">
        <Container max="measureWide">
          <Link href={PREP_BASE} className="text-sm font-semibold text-primary transition hover:text-primary-hover">
            PREPARE
          </Link>
          <h1 className="mt-6 text-[2.2rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.8rem]">
            מדריכים
          </h1>
          <p className="mt-4 max-w-[38rem] text-lg leading-relaxed text-muted">
            מה שמחפשים לפני האמירנט, עם המספרים האמיתיים של המבחן: המבנה, הציון, פרקי הניסוי של 2026 וכמה זמן
            להתכונן. כל מדריך נכתב מחומר הקורס, ומסתיים בשאלה פתורה.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            רוצים לפתור קודם?{" "}
            <Link href={`${PREP_BASE}/amirant/sample-questions`} className="font-semibold text-primary hover:underline">
              עשר שאלות לדוגמה עם תשובות
            </Link>
            .
          </p>

          {groups.map(({ topic, posts }) => (
            <section key={topic.id} aria-labelledby={`topic-${topic.id}`} className="mt-14 first-of-type:mt-12">
              <h2 id={`topic-${topic.id}`} className="text-[15px] font-bold text-muted">
                {topic.titleHe}
              </h2>
              <ul className="mt-3 border-t border-line" role="list">
                {posts.map((post) => (
                  <li key={post.slug} className="border-b border-line">
                    <Link href={`${PREP_BASE}/blog/${post.slug}`} className="group block py-6">
                      <p className="text-sm tabular-nums text-muted-2">
                        <time dateTime={post.updated ?? post.date}>{formatHeDate(post.updated ?? post.date)}</time>
                        <span aria-hidden> · </span>
                        {blogReadingMinutes(post.body)} דקות קריאה
                      </p>
                      <h3 className="mt-1.5 text-[1.35rem] font-bold leading-snug text-ink transition group-hover:text-primary md:text-[1.5rem]">
                        {post.title}
                      </h3>
                      <p className="mt-2 max-w-[42rem] text-[16px] leading-relaxed text-muted">{post.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Container>
      </PageLayout>
    </div>
  );
}
