import { PREP_COURSES, type PrepCourseCatalogItem } from "./brand";

export type CourseCatalogFilter = "all" | "amirant" | "toefl";

export function filterPrepCourses(filter: CourseCatalogFilter): PrepCourseCatalogItem[] {
  if (filter === "all") return [...PREP_COURSES];
  return PREP_COURSES.filter((c) => c.examSlug === filter);
}
