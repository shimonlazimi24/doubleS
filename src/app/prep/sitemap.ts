import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { listBlogPosts } from "@/lib/prep/blog.server";

const BASE = getPublicSiteUrl();
const PREP = `${BASE}/prep`;

/**
 * רק עמודים ציבוריים אמיתיים: בלי redirects (info/practice) ובלי עמודי שיעור -
 * robots.txt חוסם את /prep/amirant/course/ (דורש התחברות, אין ערך SEO).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const posts = listBlogPosts();
  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${PREP}/blog/${p.slug}`,
    lastModified: p.date ? new Date(`${p.date}T00:00:00Z`) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: PREP, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${PREP}/amirant`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${PREP}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...(posts.length
      ? [{ url: `${PREP}/blog`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.75 }]
      : []),
    ...blogEntries,
    { url: `${PREP}/courses`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${PREP}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${PREP}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${PREP}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
