/**
 * CMS DB override — checks cms_lessons in Supabase before falling back to the
 * static file-based lesson registry.  Server-only (uses cookies / headers).
 */
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import type { LessonContent } from "./types/content-blocks";
import { getLessonContent as getStaticLessonContent } from "./lesson-registry";

export type CmsLesson = {
  id: string;
  module_id: string | null;
  title: string;
  kind: "text" | "video" | "mixed";
  body_markdown: string | null;
  video_url: string | null;
  estimated_minutes: number;
  sort_order: number;
  published: boolean;
};

/**
 * Fetch one lesson from cms_lessons.
 * Returns null if not found or not published.
 */
export async function getCmsLesson(lessonId: string): Promise<CmsLesson | null> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("cms_lessons")
    .select("id, module_id, title, kind, body_markdown, video_url, estimated_minutes, sort_order, published")
    .eq("id", lessonId)
    .eq("published", true)
    .maybeSingle();
  return (data as CmsLesson | null) ?? null;
}

/**
 * Fetch ALL published cms lessons (used to extend the manifest dynamically).
 */
export async function getAllCmsLessons(): Promise<CmsLesson[]> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("cms_lessons")
    .select("id, module_id, title, kind, body_markdown, video_url, estimated_minutes, sort_order, published")
    .eq("published", true)
    .order("module_id")
    .order("sort_order");
  return (data as CmsLesson[]) ?? [];
}

/**
 * Returns lesson content — DB first, then static registry fallback.
 *
 * If the DB has a body_markdown for this lesson, it overrides the static file.
 * If the DB has no entry, falls back to the existing JSON / markdown source.
 * `videoUrl` מוחזר מה-CMS גם כשאין body (פרסום «וידאו בלבד» מהאדמין).
 */
export async function getLessonContentWithCmsOverride(
  lessonId: string,
): Promise<{ content: LessonContent | null; source: "cms" | "static" | "none"; videoUrl: string | null }> {
  // 1. Check DB
  const cmsLesson = await getCmsLesson(lessonId);
  const videoUrl = cmsLesson?.video_url?.trim() || null;
  if (cmsLesson?.body_markdown?.trim()) {
    return {
      content: {
        lessonId,
        blocks: [],
        // Inject markdown directly — the lesson page will use this string
        cmsMarkdown: cmsLesson.body_markdown,
        videoUrl: cmsLesson.video_url ?? undefined,
      } as LessonContent & { cmsMarkdown: string; videoUrl?: string },
      source: "cms",
      videoUrl,
    };
  }

  // 2. Fall back to static registry
  const static_ = getStaticLessonContent(lessonId);
  if (static_) return { content: static_, source: "static", videoUrl };

  return { content: null, source: "none", videoUrl };
}
