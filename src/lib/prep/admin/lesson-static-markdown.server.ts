import { getLessonContent } from "@/lib/amirant-course/lesson-registry";
import { splitMarkdownByMasachH1 } from "@/lib/amirant-course/content-source/split-markdown-masach";
import { readAmirantCourseMarkdownSource } from "@/lib/prep/amirnet-materials.server";

/**
 * The markdown a lesson renders from the course files, used to pre-fill the
 * editor. Empty for lessons built from blocks or question sets.
 */
export function getLessonStaticMarkdown(lessonId: string): string {
  const content = getLessonContent(lessonId);
  if (!content?.amirnetMarkdownRel) return "";
  const md = readAmirantCourseMarkdownSource(content.amirnetMarkdownRel);
  if (!md.ok) return "";
  if (content.amirnetMarkdownSectionIndex !== undefined) {
    const parts = splitMarkdownByMasachH1(md.body);
    return parts[content.amirnetMarkdownSectionIndex] ?? md.body;
  }
  return md.body;
}
