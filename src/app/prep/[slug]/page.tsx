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
import { getPrepMarketingPageBody, PREP_MARKETING_TITLES } from "@/lib/prep/marketing-pages";
import { Container, Heading, PageLayout, Section, Text } from "@/components/ui";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return PREP_MARKETING_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isPrepMarketingSlug(params.slug)) return {};
  return { title: PREP_MARKETING_TITLES[params.slug] };
}

export default function PrepMarketingPage({ params }: Props) {
  if (!isPrepMarketingSlug(params.slug)) notFound();
  const slug: PrepMarketingSlug = params.slug;
  if (slug === "amirant") {
    redirect(`${PREP_BASE}/amirant/course`);
  }
  if (slug === "login") {
    redirect(`${PREP_BASE}/login`);
  }
  if (slug === "pricing") {
    redirect(`${PREP_BASE}/pricing`);
  }
  const title = PREP_MARKETING_TITLES[slug];
  const body = getPrepMarketingPageBody(slug, PREP_PRODUCT_NAME);

  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container>
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-primary-hover"
          >
            ← חזרה ל־{PREP_PRODUCT_NAME}
          </Link>
          <Heading level={1} className="mt-ds-6 max-w-readable">
            {title}
          </Heading>
        </Container>
      </PageLayout>
      <Section tone="canvas" padding="loose" className="border-t border-line/80">
        <Container max="measure">
          <Text as="p" variant="bodyLg">
            {body}
          </Text>
        </Container>
      </Section>
    </div>
  );
}
