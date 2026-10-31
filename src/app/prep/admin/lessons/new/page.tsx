import Link from "next/link";
import { getManifestLesson } from "@/lib/amirant-course/manifest";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { LessonEditor } from "@/components/prep/admin/LessonEditor";
import { getLessonStaticMarkdown } from "@/lib/prep/admin/lesson-static-markdown.server";

/**
 * First edit of a course lesson: the editor opens pre-filled from the course
 * files. A free-form "new lesson" used to be possible here, but the lesson page
 * only renders ids that exist in the course manifest, so such a lesson was
 * saved, published, and then answered 404 to every learner.
 */
export default function NewLessonPage({ searchParams }: { searchParams: { id?: string } }) {
  const hit = searchParams.id ? getManifestLesson(searchParams.id) : undefined;

  if (!hit) {
    return (
      <div dir="rtl" className="max-w-2xl space-y-6">
        <AdminPageHeader title="עריכת שיעור" />
        <AdminNotice tone="info">
          אפשר לערוך רק שיעור שקיים בקורס. שיעור חדש מוסיפים בקבצי הקורס, ואז הוא מופיע כאן לעריכה.
        </AdminNotice>
        <Link href="/prep/admin/lessons" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
          לרשימת השיעורים
        </Link>
      </div>
    );
  }

  const staticMarkdown = getLessonStaticMarkdown(hit.lesson.id);
  return (
    <LessonEditor
      cmsExists={false}
      staticMarkdown={staticMarkdown}
      initial={{
        id: hit.lesson.id,
        title: hit.lesson.title,
        module_id: hit.module.id,
        body_markdown: staticMarkdown,
      }}
    />
  );
}
