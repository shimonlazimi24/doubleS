import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

/**
 * Search engines probe /sitemap.xml at the domain root by default. The real
 * sitemap lives at /prep/sitemap.xml, so the root URL returned the 404 page —
 * which is served with `noindex`. Mirroring it here means the default probe
 * finds the same list instead of a dead end.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { default: prepSitemap } = await import("./prep/sitemap");
  return prepSitemap();
}
