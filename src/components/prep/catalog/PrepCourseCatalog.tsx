import { Container, Heading, Text } from "@/components/ui";
import { PrepBreadcrumbs } from "@/components/prep/catalog/PrepBreadcrumbs";
import { PrepCourseCatalogCard } from "@/components/prep/catalog/PrepCourseCatalogCard";
import { PREP_BRAND_TAGLINE_HE, PREP_COURSES } from "@/lib/prep/brand";

type Props = {
  showBreadcrumbs?: boolean;
  breadcrumbTrail?: { label: string; href?: string }[];
  id?: string;
};

/* שני קורסים בקטלוג - סינון בצ'יפים היה כרום מיותר. */
export function PrepCourseCatalog({ showBreadcrumbs = false, breadcrumbTrail = [], id = "catalog" }: Props) {
  return (
    <section id={id} className="border-t border-line/60 bg-paper py-section md:py-section-lg">
      <Container>
        {showBreadcrumbs && <PrepBreadcrumbs items={breadcrumbTrail} />}

        <div className="mb-ds-8 max-w-2xl text-start">
          <Text as="p" variant="labelAccent" className="mb-ds-2">
            ההכנות שלנו
          </Text>
          <Heading level={2}>קורסים ומבחני אנגלית</Heading>
          <Text as="p" variant="body" className="mt-ds-3 text-muted">
            {PREP_BRAND_TAGLINE_HE}
          </Text>
        </div>

        <ul className="grid grid-cols-1 gap-ds-5 sm:grid-cols-2">
          {PREP_COURSES.map((course) => (
            <li key={course.id}>
              <PrepCourseCatalogCard course={course} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
