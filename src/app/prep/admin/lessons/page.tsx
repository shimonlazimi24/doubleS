import type { Metadata } from "next";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import {
  AdminLessonBrowser,
  type AdminLessonModule,
  type AdminLessonRow,
} from "@/components/prep/admin/AdminLessonBrowser";

async function getCmsLessonsMap(): Promise<{ map: Map<string, { published: boolean }>; error: string | null }> {
  const map = new Map<string, { published: boolean }>();
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return { map, error: "Supabase לא מוגדר בסביבה הזו, ולכן לא ידוע אילו שיעורים נערכו." };
  const { data, error } = await supabase.from("cms_lessons").select("id, published");
  if (error) return { map, error: "קריאת השיעורים הערוכים נכשלה. המצב שמוצג כאן אינו מעודכן." };
  for (const row of data ?? []) map.set(row.id, { published: row.published });
  return { map, error: null };
}

function seedLessonHref(moduleId: string, id: string, title: string): string {
  const params = new URLSearchParams({ id, title, module: moduleId });
  return `/prep/admin/lessons/new?${params.toString()}`;
}

export const metadata: Metadata = { title: "שיעורים | PREPARE admin" };

export default async function LessonsPage() {
  const { map: cmsMap, error } = await getCmsLessonsMap();
  const manifest = AMIRANT_PREPARATION_MANIFEST;

  const modules: AdminLessonModule[] = manifest.modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    lessons: mod.lessons.map((lesson) => {
      const cms = cmsMap.get(lesson.id);
      const status: AdminLessonRow["status"] = !cms
        ? "default"
        : cms.published
          ? "published"
          : "draft";
      return {
        id: lesson.id,
        title: lesson.title,
        status,
        href:
          status === "default"
            ? seedLessonHref(mod.id, lesson.id, lesson.title)
            : `/prep/admin/lessons/${lesson.id}`,
      };
    }),
  }));

  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const editedCount = modules
    .flatMap((mod) => mod.lessons)
    .filter((lesson) => lesson.status !== "default").length;

  return (
    <div dir="rtl" className="max-w-3xl space-y-6">
      <AdminPageHeader
        title="שיעורים"
        subtitle={`${totalLessons} שיעורים בקורס · ${editedCount} עם גרסה ערוכה. שיעור חדש נוסף בקבצי הקורס, לא כאן: עמוד השיעור מציג רק שיעורים שקיימים בהם.`}
      />
      {error ? <AdminNotice tone="warning">{error}</AdminNotice> : null}

      <AdminLessonBrowser modules={modules} />
    </div>
  );
}
