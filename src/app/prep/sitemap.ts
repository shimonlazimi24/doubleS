import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { listBlogPosts } from "@/lib/prep/blog.server";
import { buildPrepSitemap } from "@/lib/prep/seo/sitemap-entries";

/** Page list and lastmod dates live in src/lib/prep/seo/sitemap-entries.ts (unit-tested). */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildPrepSitemap(getPublicSiteUrl(), listBlogPosts());
}
