import type { MetadataRoute } from "next";

/**
 * Public pages and when their content last changed.
 *
 * `lastmod` used to be "now" on every build, so every deploy told Google the
 * whole site had changed - a signal it learns to ignore. These dates are the
 * last substantive content edit of each page (bump when the copy changes, not
 * when the code around it does).
 */
export const PREP_SITEMAP_PAGES: readonly {
  path: string;
  lastModified: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/prep", lastModified: "2026-10-31", changeFrequency: "weekly", priority: 1.0 },
  { path: "/prep/amirant", lastModified: "2026-10-31", changeFrequency: "weekly", priority: 0.95 },
  { path: "/prep/amirant/sample-questions", lastModified: "2026-10-31", changeFrequency: "monthly", priority: 0.8 },
  { path: "/prep/pricing", lastModified: "2026-10-22", changeFrequency: "monthly", priority: 0.8 },
  // The index follows its newest post (see buildPrepSitemap), so this date only matters while it is newer.
  { path: "/prep/blog", lastModified: "2026-07-22", changeFrequency: "weekly", priority: 0.8 },
  { path: "/prep/courses", lastModified: "2026-07-12", changeFrequency: "monthly", priority: 0.5 },
  { path: "/prep/about", lastModified: "2026-08-20", changeFrequency: "monthly", priority: 0.6 },
  { path: "/prep/contact", lastModified: "2026-08-20", changeFrequency: "yearly", priority: 0.4 },
  { path: "/prep/terms", lastModified: "2026-08-20", changeFrequency: "yearly", priority: 0.3 },
  { path: "/prep/privacy", lastModified: "2026-08-20", changeFrequency: "yearly", priority: 0.3 },
  { path: "/prep/accessibility", lastModified: "2026-10-22", changeFrequency: "yearly", priority: 0.3 },
];

export type SitemapPost = { slug: string; date: string; updated?: string };

function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/**
 * Only real public pages: no redirects (info/practice/demo/learn), no login,
 * no placeholder (toefl) and no course pages - robots.txt blocks
 * /prep/amirant/course/ (requires login, no SEO value).
 */
export function buildPrepSitemap(baseUrl: string, posts: readonly SitemapPost[]): MetadataRoute.Sitemap {
  const blogIndex = PREP_SITEMAP_PAGES.find((p) => p.path === "/prep/blog")!;
  const newestPost = posts
    .map((p) => p.updated ?? p.date)
    .filter(Boolean)
    .sort()
    .at(-1);

  const pages: MetadataRoute.Sitemap = PREP_SITEMAP_PAGES.filter(
    (p) => p.path !== "/prep/blog" || posts.length > 0,
  ).map((p) => ({
    url: `${baseUrl}${p.path}`,
    // The blog index changes whenever a post does.
    lastModified: isoToDate(
      p.path === "/prep/blog" && newestPost && newestPost > p.lastModified ? newestPost : p.lastModified,
    ),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/prep/blog/${p.slug}`,
    lastModified: isoToDate(p.updated ?? p.date ?? blogIndex.lastModified),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...pages, ...blogEntries];
}
