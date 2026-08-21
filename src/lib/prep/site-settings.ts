/**
 * Client-safe shape of the site settings.
 *
 * Kept apart from `site-settings.server.ts`: that module reaches for
 * `next/headers` through the Supabase server client, so importing it from a
 * client component breaks the build.
 */

export const SITE_VIDEO_SLOTS = {
  home: {
    label: "סרטון בעמוד הבית",
    hint: "מוצג מתחת לכותרת הראשית ב-/prep. משאירים ריק כדי לא להציג כלום.",
  },
  courseRoadmap: {
    label: "סרטון בעמוד הקורס",
    hint: "מוצג בראש עמוד הקורס, מעל «מפת הדרכים». משאירים ריק כדי לא להציג כלום.",
  },
} as const;

export type SiteVideoSlot = keyof typeof SITE_VIDEO_SLOTS;
export type SiteVideos = Record<SiteVideoSlot, string>;

export const EMPTY_SITE_VIDEOS: SiteVideos = { home: "", courseRoadmap: "" };

export const SITE_VIDEOS_SETTINGS_KEY = "videos";
