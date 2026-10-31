import { notFound, redirect } from "next/navigation";
import { getManifestLesson } from "@/lib/amirant-course/manifest";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { LessonEditor } from "@/components/prep/admin/LessonEditor";
import { getLessonStaticMarkdown } from "@/lib/prep/admin/lesson-static-markdown.server";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const hit = getManifestLesson(id);
  const supabase = createPrepSupabaseServerClient();

  if (!supabase) {
    if (!hit) notFound();
    return (
      <div dir="rtl" className="max-w-2xl space-y-6">
        <AdminPageHeader title="עריכת שיעור" />
        <AdminNotice tone="error">Supabase לא מוגדר בסביבה הזו, ולכן אי אפשר לטעון או לשמור עריכות.</AdminNotice>
      </div>
    );
  }

  const { data: lesson, error } = await supabase.from("cms_lessons").select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <div dir="rtl" className="max-w-2xl space-y-6">
        <AdminPageHeader title="עריכת שיעור" />
        <AdminNotice tone="error">קריאת השיעור נכשלה. רעננו את הדף; אם זה חוזר, בדקו שטבלת cms_lessons קיימת.</AdminNotice>
      </div>
    );
  }

  if (!lesson) {
    if (!hit) notFound();
    // No override yet: same as a first edit.
    redirect(`/prep/admin/lessons/new?id=${encodeURIComponent(id)}`);
  }

  const staticMarkdown = getLessonStaticMarkdown(id);
  return (
    <LessonEditor
      cmsExists
      orphan={!hit}
      staticMarkdown={staticMarkdown}
      initial={{
        id: lesson.id,
        title: lesson.title,
        kind: lesson.kind,
        module_id: lesson.module_id ?? "",
        // An empty CMS body means "text from the course files"; show that text, and the
        // editor sends it back empty unless it was actually changed.
        body_markdown: lesson.body_markdown?.trim() ? lesson.body_markdown : staticMarkdown,
        video_url: lesson.video_url ?? "",
        estimated_minutes: lesson.estimated_minutes ?? 10,
        sort_order: lesson.sort_order ?? 0,
        published: lesson.published ?? false,
      }}
    />
  );
}
