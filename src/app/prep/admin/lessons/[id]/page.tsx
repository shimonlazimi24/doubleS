import { notFound } from "next/navigation";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { LessonEditor } from "@/components/prep/admin/LessonEditor";
import { getLessonContent } from "@/lib/amirant-course";
import { readAmirantCourseMarkdownSource } from "@/lib/prep/amirnet-materials.server";
import { splitMarkdownByMasachH1 } from "@/lib/amirant-course/content-source/split-markdown-masach";

function getStaticMarkdown(lessonId: string): string {
  const content = getLessonContent(lessonId);
  if (!content) return "";
  if (content.amirnetMarkdownRel) {
    const md = readAmirantCourseMarkdownSource(content.amirnetMarkdownRel);
    if (!md.ok) return "";
    if (content.amirnetMarkdownSectionIndex !== undefined) {
      const parts = splitMarkdownByMasachH1(md.body);
      return parts[content.amirnetMarkdownSectionIndex] ?? md.body;
    }
    return md.body;
  }
  return "";
}

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) notFound();

  const { data: lesson } = await supabase
    .from("cms_lessons")
    .select("*")
    .eq("id", params.id)
    .single();

  // If no CMS entry yet, pre-load static markdown
  const staticMarkdown = getStaticMarkdown(params.id);

  if (lesson) {
    return (
      <LessonEditor
        initial={{
          id: lesson.id,
          title: lesson.title,
          kind: lesson.kind,
          module_id: lesson.module_id ?? "",
          // Show CMS content; fall back to static if CMS body is empty
          body_markdown: lesson.body_markdown?.trim() ? lesson.body_markdown : staticMarkdown,
          video_url: lesson.video_url ?? "",
          estimated_minutes: lesson.estimated_minutes ?? 10,
          sort_order: lesson.sort_order ?? 0,
          published: lesson.published ?? false,
        }}
        cmsExists
      />
    );
  }

  // No CMS entry - pre-fill from static registry
  if (!staticMarkdown) notFound();

  // Get lesson title from manifest
  const { getManifestLesson } = await import("@/lib/amirant-course");
  const hit = getManifestLesson(params.id);

  return (
    <LessonEditor
      initial={{
        id: params.id,
        title: hit?.lesson.title ?? params.id,
        module_id: hit?.module.id ?? "",
        body_markdown: staticMarkdown,
      }}
      cmsExists={false}
    />
  );
}
