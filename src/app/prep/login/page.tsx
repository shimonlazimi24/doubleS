import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PREP_BASE, PREP_PRODUCT_NAME } from "@/lib/prep/constants";
import { PrepLoginForm } from "@/components/prep/PrepLoginForm";
import { Container, Heading, Text } from "@/components/ui";
import { PREP_PAGE_META } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export const metadata: Metadata = {
  title: PREP_PAGE_META.login.title,
  description: PREP_PAGE_META.login.description,
  alternates: { canonical: `${getPublicSiteUrl()}/prep/login` },
  // A sign-in form is not a landing page; keep it out of the index (links still followed).
  robots: { index: false, follow: true },
};

/** מסך ממוקד אחד: כותרת צמודה לטופס, בלי רצועות ריק (DESIGN_GUIDELINES: one purpose per screen). */
export default function PrepLoginPage() {
  return (
    <div className="min-h-[70vh] bg-canvas">
      <Container max="measure" className="py-10 md:py-14">
        <Link
          href={PREP_BASE}
          className="text-xs font-semibold tracking-[0.14em] text-accent transition hover:text-primary"
        >
          חזרה ל־{PREP_PRODUCT_NAME}
        </Link>
        <Heading level={1} className="mt-5">
          התחברות
        </Heading>
        <Text as="p" variant="body" className="mt-2 text-muted">
          ההתקדמות שלכם נשמרת בחשבון - וממשיכים מאותה נקודה מכל מכשיר.
        </Text>
        <div className="mt-8">
          <Suspense fallback={<Text as="p" variant="body">טוען…</Text>}>
            <PrepLoginForm />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
