import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import {
  EMPTY_SITE_VIDEOS,
  SITE_VIDEOS_SETTINGS_KEY,
  type SiteVideoSlot,
  type SiteVideos,
} from "@/lib/prep/site-settings";

/**
 * Reads the site-level settings edited from the admin.
 *
 * Reads go through the ordinary client — `prep_site_settings` has a public
 * SELECT policy, because these values are shown to anonymous visitors on the
 * marketing page. Writes are service-role only, behind /api/prep/admin/settings.
 */
function normalize(raw: unknown): SiteVideos {
  const value = (raw ?? {}) as Partial<Record<SiteVideoSlot, unknown>>;
  const pick = (slot: SiteVideoSlot) =>
    typeof value[slot] === "string" ? (value[slot] as string).trim() : "";
  return { home: pick("home"), courseRoadmap: pick("courseRoadmap") };
}

export async function getSiteVideos(): Promise<SiteVideos> {
  const client = createPrepSupabaseServerClient();
  if (!client) return EMPTY_SITE_VIDEOS;
  const { data } = await client
    .from("prep_site_settings")
    .select("value")
    .eq("key", SITE_VIDEOS_SETTINGS_KEY)
    .maybeSingle();
  return normalize(data?.value);
}
