import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";
import {
  EMPTY_SITE_VIDEOS,
  SITE_VIDEOS_SETTINGS_KEY,
  type SiteVideoSlot,
  type SiteVideos,
} from "@/lib/prep/site-settings";

/**
 * Reads the site-level settings edited from the admin.
 *
 * Deliberately does **not** use the cookie-backed server client. Reading cookies
 * marks the page dynamic, and this value is public — `prep_site_settings` has a
 * public SELECT policy and the same bytes go to every visitor. When the home
 * page first read it through the session client it stopped being cacheable, and
 * every click on it travelled from the Frankfurt edge to the US region to
 * re-render. A plain anon client keeps the page on the CDN.
 *
 * Writes remain service-role only, behind /api/prep/admin/settings.
 */

const REVALIDATE_SECONDS = 60;

async function fetchSiteVideos(): Promise<SiteVideos> {
  const env = getPrepSupabasePublishableEnv();
  if (!env) return EMPTY_SITE_VIDEOS;

  const client = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await client
    .from("prep_site_settings")
    .select("value")
    .eq("key", SITE_VIDEOS_SETTINGS_KEY)
    .maybeSingle();

  const value = (data?.value ?? {}) as Partial<Record<SiteVideoSlot, unknown>>;
  const pick = (slot: SiteVideoSlot) =>
    typeof value[slot] === "string" ? (value[slot] as string).trim() : "";
  return { home: pick("home"), courseRoadmap: pick("courseRoadmap") };
}

/** Cached so a marketing page render does not wait on a database round trip. */
export const getSiteVideos = unstable_cache(fetchSiteVideos, ["prep-site-videos"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["prep-site-videos"],
});
