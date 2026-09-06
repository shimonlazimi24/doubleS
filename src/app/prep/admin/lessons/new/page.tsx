import { LessonEditor } from "@/components/prep/admin/LessonEditor";
import { getLessonContent } from "@/lib/amirant-course/lesson-registry";
import { readAmirantCourseMarkdownSource } from "@/lib/prep/amirnet-materials.server";
import { splitMarkdownByMasachH1 } from "@/lib/amirant-course/content-source/split-markdown-masach";

function getStaticMarkdown(lessonId: string): string {
  const content = getLessonContent(lessonId);
  if (!content) return "";
  if (content.amirnetMarkdownRel) {
    const md = readAmirantCourseMarkdownSource(content.amirnetMarkdownRel);
    if (!md.ok) return "";
    const body = md.body;
    if (content.amirnetMarkdownSectionIndex !== undefined) {
      const parts = splitMarkdownByMasachH1(body);
      return parts[content.amirnetMarkdownSectionIndex] ?? body;
    }
    return body;
  }
  return "";
}

export default function NewLessonPage({
  searchParams,
}: {
  searchParams: { id?: string; title?: string; module?: string };
}) {
  const existingMarkdown = searchParams.id ? getStaticMarkdown(searchParams.id) : "";

  return (
    <LessonEditor
      cmsExists={false}
      initial={
        searchParams.id
          ? {
              id: searchParams.id,
              title: searchParams.title ?? "",
              module_id: searchParams.module ?? "",
              body_markdown: existingMarkdown,
            }
          : undefined
      }
    />
  );
}
