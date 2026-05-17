"use client";

import { useState } from "react";
import { Container, Heading, Text } from "@/components/ui";
import { PrepBreadcrumbs } from "@/components/prep/catalog/PrepBreadcrumbs";
import { PrepCourseCatalogCard } from "@/components/prep/catalog/PrepCourseCatalogCard";
import { filterPrepCourses, type CourseCatalogFilter } from "@/lib/prep/course-catalog";
import { PREP_BRAND_TAGLINE_HE } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

const FILTERS: { id: CourseCatalogFilter; label: string }[] = [
  { id: "all", label: "הכל" },
  { id: "amirant", label: "אמירנט" },
  { id: "toefl", label: "TOEFL" },
];

type Props = {
  showBreadcrumbs?: boolean;
  breadcrumbTrail?: { label: string; href?: string }[];
  id?: string;
};

export function PrepCourseCatalog({ showBreadcrumbs = false, breadcrumbTrail = [], id = "catalog" }: Props) {
  const [filter, setFilter] = useState<CourseCatalogFilter>("all");
  const courses = filterPrepCourses(filter);

  return (
    <section id={id} className="bg-paper py-ds-12 md:py-ds-16">
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

        <div className="mb-ds-8 flex flex-wrap gap-2" role="tablist" aria-label="סינון קורסים">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                filter === f.id
                  ? "border-primary bg-primary text-paper"
                  : "border-line bg-paper hover:bg-surface-low",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ul className="grid grid-cols-1 gap-ds-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id}>
              <PrepCourseCatalogCard course={course} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
