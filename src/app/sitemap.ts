import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { listBlogPosts } from "@/lib/prep/blog.server";
import { buildPrepSitemap } from "@/lib/prep/seo/sitemap-entries";

/**
 * Search engines probe /sitemap.xml at the domain root by default, so the
 * same list is served here and at /prep/sitemap.xml.
 *
 * Built at build time on purpose: the blog posts are read from content/blog
 * with fs, and that folder is not shipped inside the serverless function, so
 * a request-time sitemap silently listed no posts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return buildPrepSitemap(getPublicSiteUrl(), listBlogPosts());
}
