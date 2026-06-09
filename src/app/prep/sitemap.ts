import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";

const BASE = getPublicSiteUrl();
const PREP = `${BASE}/prep`;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: PREP, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${PREP}/amirant`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${PREP}/amirant/course`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${PREP}/amirant/info`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${PREP}/amirant/practice`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${PREP}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${PREP}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${PREP}/courses`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${PREP}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Individual lesson pages
  const lessonPages: MetadataRoute.Sitemap = AMIRANT_PREPARATION_MANIFEST.modules
    .flatMap((m) => m.lessons)
    .map((lesson) => ({
      url: `${PREP}/amirant/course/lesson/${lesson.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...staticPages, ...lessonPages];
}
