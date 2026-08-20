import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import {
  AdminLessonBrowser,
  type AdminLessonModule,
  type AdminLessonRow,
} from "@/components/prep/admin/AdminLessonBrowser";

async function getCmsLessonsMap(): Promise<Map<string, { published: boolean }>> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return new Map();
  const { data } = await supabase.from("cms_lessons").select("id, published");
  const map = new Map<string, { published: boolean }>();
  for (const row of data ?? []) map.set(row.id, { published: row.published });
  return map;
}

function seedLessonHref(moduleId: string, id: string, title: string): string {
  const params = new URLSearchParams({ id, title, module: moduleId });
  return `/prep/admin/lessons/new?${params.toString()}`;
}

export default async function LessonsPage() {
  const cmsMap = await getCmsLessonsMap();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">עריכת הקורס</h1>
          <p className="mt-1 text-sm text-muted">
            {totalLessons} שיעורים · {editedCount} עם תוכן מותאם
          </p>
        </div>
        <Link
          href="/prep/admin/lessons/new"
          className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          שיעור חדש
        </Link>
      </div>

      <AdminLessonBrowser modules={modules} />
    </div>
  );
}
