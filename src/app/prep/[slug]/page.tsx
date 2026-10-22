import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import {
  PREP_BASE,
  PREP_MARKETING_SLUGS,
  PREP_PRODUCT_NAME,
  type PrepMarketingSlug,
  isPrepMarketingSlug,
} from "@/lib/prep/constants";
import {
  getPrepMarketingPageBody,
  PREP_MARKETING_PAGES,
  PREP_MARKETING_TITLES,
  SUPPORT_EMAIL,
  type MarketingPageContent,
} from "@/lib/prep/marketing-pages";
import { Container, Heading, Text } from "@/components/ui";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, type PrepPageMetaKey, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

type Props = { params: { slug: string } };

const siteUrl = getPublicSiteUrl();

/**
 * Slugs that have a dedicated route (src/app/prep/<slug>/page.tsx). The static
 * route wins at request time, but prerendering them here too wrote a 307-to-
 * itself into the same `.next/server/app/prep/<slug>.html` the real page uses -
 * whichever finished last won, and one build produced /prep/about as a 307 to itself.
 */
const DEDICATED_ROUTE_SLUGS: ReadonlySet<PrepMarketingSlug> = new Set<PrepMarketingSlug>([
  "amirant",
  "pricing",
  "about",
  "login",
  "blog",
]);

export function generateStaticParams() {
  return PREP_MARKETING_SLUGS.filter((slug) => !DEDICATED_ROUTE_SLUGS.has(slug)).map((slug) => ({ slug }));
}

/** Placeholder "coming soon" page: reachable, but not worth a search result of its own. */
const NOINDEX_SLUGS: ReadonlySet<PrepMarketingSlug> = new Set<PrepMarketingSlug>(["toefl"]);

export function generateMetadata({ params }: Props): Metadata {
  if (!isPrepMarketingSlug(params.slug)) return {};
  const slug = params.slug;
  const url = `${siteUrl}/prep/${slug}`;
  const meta = slug in PREP_PAGE_META ? PREP_PAGE_META[slug as PrepPageMetaKey] : null;
  const title = meta?.title ?? PREP_MARKETING_TITLES[slug];
  return {
    title,
    // Without a description of its own each of these pages inherited the layout's,
    // so contact, terms and privacy all carried the same snippet.
    description: meta?.description,
    // Without its own canonical this page inherited the layout's, which pointed
    // at /prep — so contact, terms and privacy were submitted in the sitemap
    // while telling Google they were duplicates of the home page.
    alternates: { canonical: url },
    openGraph: meta ? prepOpenGraph(siteUrl, { ...meta, path: `/prep/${slug}` }) : undefined,
    robots: NOINDEX_SLUGS.has(slug) ? { index: false, follow: true } : undefined,
  };
}

function ContactCard() {
  return (
    <div className="mt-10 rounded-2xl border border-line bg-paper p-6 sm:p-8">
      <Text as="p" variant="labelAccent" className="text-accent">
        יצירת קשר
      </Text>
      <p className="mt-2 text-lg font-semibold text-ink" dir="ltr" style={{ textAlign: "end" }}>
        {SUPPORT_EMAIL}
      </p>
      <Text as="p" variant="bodySm" className="mt-1 text-muted">
        מענה בתוך יום עסקים
      </Text>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
      >
        כתבו לנו
      </a>
    </div>
  );
}

function StructuredMarketingPage({
  slug,
  title,
  content,
}: {
  slug: PrepMarketingSlug;
  title: string;
  content: MarketingPageContent;
}) {
  return (
    <div className="bg-canvas">
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: title, path: `${PREP_BASE}/${slug}` },
        ])}
      />
      {/* Header קומפקטי - בלי חלל ריק */}
      <div className="border-b border-line bg-paper">
        <Container max="readable" className="py-10 md:py-14">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold tracking-[0.14em] text-accent transition hover:text-primary"
          >
            חזרה ל־{PREP_PRODUCT_NAME}
          </Link>
          <Text as="p" variant="labelAccent" className="mt-6 text-accent">
            {content.eyebrow}
          </Text>
          <Heading level={1} className="mt-2">
            {title}
          </Heading>
          <Text as="p" variant="bodyLg" className="mt-3 max-w-[52ch] text-muted">
            {content.lede}
          </Text>
          {content.lastUpdated ? (
            <Text as="p" variant="caption" className="mt-4 text-muted-2">
              עדכון אחרון: {content.lastUpdated}
            </Text>
          ) : null}
        </Container>
      </div>

      <Container max="readable" className="py-10 md:py-14">
        <div className="space-y-9">
          {content.sections.map((section, i) => (
            <section key={section.heading ?? i}>
              {section.heading ? (
                <h2 className="border-t border-line pt-7 text-xl font-bold tracking-tight text-ink md:text-2xl">
                  {section.heading}
                </h2>
              ) : null}
              {section.body ? (
                <Text as="p" variant="body" className="mt-3 text-ink/90">
                  {section.body}
                </Text>
              ) : null}
              {section.bullets ? (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span className="text-base leading-7 text-ink/90">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {content.contactCard ? <ContactCard /> : null}
      </Container>
    </div>
  );
}

export default function PrepMarketingPage({ params }: Props) {
  if (!isPrepMarketingSlug(params.slug)) notFound();
  const slug: PrepMarketingSlug = params.slug;
  if (slug === "amirant") {
    redirect(`${PREP_BASE}/amirant`);
  }
  if (slug === "login") {
    redirect(`${PREP_BASE}/login`);
  }
  if (slug === "pricing") {
    redirect(`${PREP_BASE}/pricing`);
  }
  if (slug === "about") {
    // עמוד ייעודי - src/app/prep/about (עריכתי, עם פס נתונים וסקשן שיטה)
    redirect(`${PREP_BASE}/about`);
  }

  const title = PREP_MARKETING_TITLES[slug];
  const content = PREP_MARKETING_PAGES[slug];
  if (content) {
    return <StructuredMarketingPage slug={slug} title={title} content={content} />;
  }

  // fallback לסלאגים בלי תוכן מובנה (toefl/blog)
  const body = getPrepMarketingPageBody(slug, PREP_PRODUCT_NAME);
  return (
    <div className="bg-canvas">
      <div className="border-b border-line bg-paper">
        <Container max="readable" className="py-10 md:py-14">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold tracking-[0.14em] text-accent transition hover:text-primary"
          >
            חזרה ל־{PREP_PRODUCT_NAME}
          </Link>
          <Heading level={1} className="mt-6">
            {title}
          </Heading>
        </Container>
      </div>
      <Container max="readable" className="py-10 md:py-14">
        <Text as="p" variant="bodyLg" className="whitespace-pre-line">
          {body}
        </Text>
      </Container>
    </div>
  );
}
