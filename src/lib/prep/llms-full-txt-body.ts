import { EXAM_AUTHORITY } from "@/lib/amirant-course/exam-facts";

export type LlmsFullPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  body: string;
};

/** Markdown links become "text (url)" with site-relative paths made absolute; emphasis marks go. */
function markdownToPlainText(body: string, baseUrl: string): string {
  return body
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (_m, text: string, path: string) => `${text} (${baseUrl}${path})`)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]*)\)/g, (_m, text: string, url: string) => `${text} (${url})`)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^> ?/gm, "");
}

/**
 * `/llms-full.txt`: every guide in full, as plain text, one after the other.
 * Answer engines that read llms.txt follow this link for the body text
 * instead of fetching and stripping each HTML page.
 */
export function buildLlmsFullTxtBody(baseUrl: string, posts: readonly LlmsFullPost[]): string {
  const prep = `${baseUrl}/prep`;
  const head = [
    `# PREPARE - מדריכים להכנה לאמירנט (טקסט מלא)`,
    `> ${prep}/blog`,
    `> ${posts.length} מדריכים בעברית על מבחן האמירנט של ${EXAM_AUTHORITY.shortHe}, מתוך קורס ההכנה PREPARE (getprepared.academy). קורס עצמאי - אינו קשור ל${EXAM_AUTHORITY.shortHe}. המדריך הקצר של האתר: ${baseUrl}/llms.txt`,
  ].join("\n");

  const sections = posts.map((p) => {
    const dates = p.updated && p.updated !== p.date ? `פורסם ${p.date}, עודכן ${p.updated}` : `פורסם ${p.date}`;
    return [
      `## ${p.title}`,
      `URL: ${prep}/blog/${p.slug}`,
      `${dates}`,
      `תקציר: ${p.description}`,
      "",
      markdownToPlainText(p.body, baseUrl),
    ].join("\n");
  });

  return [head, ...sections].join("\n\n---\n\n") + "\n";
}
