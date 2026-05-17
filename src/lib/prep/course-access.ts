import type { ManifestModule } from "@/lib/amirant-course/types/course-manifest";

/** First module is free for preview; all others require paid access. */
export const AMIRANT_FREE_MODULE_SLUGS = new Set<string>(["introduction"]);

export function isAmirantModuleFree(module: Pick<ManifestModule, "slug">): boolean {
  return AMIRANT_FREE_MODULE_SLUGS.has(module.slug);
}

export function isAmirantModuleLocked(
  module: Pick<ManifestModule, "slug">,
  hasFullAccess: boolean,
): boolean {
  if (hasFullAccess) return false;
  return !isAmirantModuleFree(module);
}
