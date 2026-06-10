import { notFound } from "next/navigation";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { LessonEditor } from "@/components/prep/admin/LessonEditor";

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) notFound();

  const { data: lesson } = await supabase
    .from("cms_lessons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lesson) notFound();

  return (
    <LessonEditor
      initial={{
        id: lesson.id,
        title: lesson.title,
        kind: lesson.kind,
        module_id: lesson.module_id ?? "",
        body_markdown: lesson.body_markdown ?? "",
        video_url: lesson.video_url ?? "",
        estimated_minutes: lesson.estimated_minutes ?? 10,
        sort_order: lesson.sort_order ?? 0,
        published: lesson.published ?? false,
      }}
    />
  );
}
