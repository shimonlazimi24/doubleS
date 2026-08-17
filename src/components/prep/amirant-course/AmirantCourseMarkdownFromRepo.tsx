import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { stripMasachNumberingForDisplay } from "@/lib/amirant-course/content-source/split-markdown-masach";
import {
  isolateFillInBlanks,
  stripHtmlAnchorNoise,
  stripTaskListCheckboxes,
} from "@/lib/amirant-course/lesson-content/strip-lesson-markdown-noise";

const MAX_CHARS = 120_000;

type Props = {
  body: string;
};

/** טקסט גולמי מתוך עץ ReactNode (מספיק לספירת תווים; לא לרינדור). */
function nodeToText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (typeof node === "object" && "props" in (node as Record<string, unknown>)) {
    return nodeToText((node as { props?: { children?: unknown } }).props?.children);
  }
  return "";
}

/** גדר קוד שתוכנה בעיקר עברית - מרונדרת RTL כ"דף עבודה" ולא כקוד LTR. */
export function isHebrewDominantNode(children: unknown): boolean {
  const text = nodeToText(children);
  const hebrew = (text.match(/[א-ת]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return hebrew > 5 && hebrew > latin;
}

/**
 * ההופכי: בלוק שרובו אנגלית (קטע קריאה של הבנת הנקרא) - חייב LTR ויישור שמאל.
 * בירושת RTL מהעמוד סימני פיסוק "קופצים" לתחילת השורה (".social isolation").
 */
export function isLatinDominantNode(children: unknown): boolean {
  const text = nodeToText(children);
  const hebrew = (text.match(/[א-ת]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return latin > 5 && latin > hebrew;
}

/**
 * פסקאות/פריטים שצריכים LTR: אנגלית דומיננטית, או משפטי השלמה עם קו (`_____`)
 * גם כשיש תווית עברית קצרה לידם ("שאלה: She _____ …").
 */
export function needsLtrMarkdownProse(children: unknown): boolean {
  if (isLatinDominantNode(children)) return true;
  const text = nodeToText(children);
  return /_{3,}/.test(text) && /[A-Za-z]/.test(text);
}

export const AMIRANT_COURSE_MD_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h2 className="mb-3 mt-8 border-b border-line/60 pb-2 text-2xl font-bold text-ink first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => <h3 className="mb-2 mt-6 text-xl font-semibold text-ink first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-4 text-lg font-semibold text-ink">{children}</h4>,
  h4: ({ children }) => <h5 className="mb-2 mt-3 text-base font-semibold text-ink">{children}</h5>,
  p: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <p className="mb-3 text-base leading-relaxed text-ink last:mb-0 [direction:ltr] [text-align:left]" lang="en">
        {children}
      </p>
    ) : (
      <p className="mb-3 text-base leading-relaxed text-ink last:mb-0">{children}</p>
    ),
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pr-6 text-ink marker:text-primary/80">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pr-6 text-ink marker:font-medium">{children}</ol>,
  li: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <li className="leading-relaxed [direction:ltr] [text-align:left]" lang="en">
        {children}
      </li>
    ) : (
      <li className="leading-relaxed">{children}</li>
    ),
  blockquote: ({ children }) =>
    isLatinDominantNode(children) ? (
      // קטע אנגלי (הבנת הנקרא): פאנל קריאה שקט - LTR, יישור שמאל, קו-שיער בצד שמאל
      <blockquote className="my-4 max-w-none py-1 leading-[1.8] text-ink [direction:ltr] [text-align:left] [&>p:last-child]:mb-0">
        {children}
      </blockquote>
    ) : (
      <blockquote className="my-4 border-s-4 border-primary/35 bg-primary/[0.04] py-2 ps-4 pe-2 text-ink [&>p]:mb-0">
        {children}
      </blockquote>
    ),
  hr: () => <hr className="my-6 border-line/80" />,
  a: ({ href, children }) => {
    const safe =
      typeof href === "string" &&
      (href.startsWith("/") ||
        href.startsWith("https://") ||
        href.startsWith("http://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:"));
    if (!safe) {
      return <span className="font-medium text-primary">{children}</span>;
    }
    return (
      <a
        href={href}
        className="font-medium text-primary underline-offset-2 hover:underline"
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => {
    const safe =
      typeof src === "string" &&
      (src.startsWith("/") || src.startsWith("https://") || src.startsWith("http://") || src.startsWith("data:image/"));
    if (!safe) return null;
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className="my-3 h-auto max-w-full rounded-md border border-line/40"
        loading="lazy"
      />
    );
  },
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code className={cn("block w-full font-mono text-sm text-slate-100", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-surface-low px-1.5 py-0.5 font-mono text-sm text-ink" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    if (isHebrewDominantNode(children)) {
      // גדר שרובה עברית = "דף עבודה" (טבלת זמנים, גיליון מעקב) - RTL בקופסה בהירה,
      // לא בלוק קוד כהה LTR שהופך את העברית לג'יבריש מיושר שמאלה.
      return (
        <pre className="mb-4 whitespace-pre-wrap rounded-surface border border-line/60 bg-surface-low/60 p-3 font-sans text-sm leading-relaxed text-ink [direction:rtl] [text-align:right] [overflow-wrap:anywhere]">
          {children}
        </pre>
      );
    }
    return (
      <pre className="mb-4 overflow-x-auto whitespace-pre-wrap [overflow-wrap:anywhere] rounded-surface border border-line/50 bg-ink/95 p-3 shadow-inner [direction:ltr] [text-align:left]">{children}</pre>
    );
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-surface border border-line/80">
      <table className="w-full min-w-[16rem] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-low/80">{children}</thead>,
  th: ({ children }) => <th className="border border-line/60 px-3 py-2 text-start font-semibold text-ink">{children}</th>,
  td: ({ children }) => <td className="border border-line/50 px-3 py-2 text-start align-top text-ink">{children}</td>,
  tr: ({ children }) => <tr className="odd:bg-paper even:bg-surface-low/30">{children}</tr>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
};

/**
 * מציג קובץ Markdown מעוצב (לא גולמי) - היה `<pre>` שגרם ל־`#` ו־`**` להופיע כטקסט.
 */
export function AmirantCourseMarkdownFromRepo({ body }: Props) {
  const truncated = body.length > MAX_CHARS;
  const raw = truncated ? `${body.slice(0, MAX_CHARS)}\n\n… [נחתך - ${body.length.toLocaleString("he-IL")} תווים בקובץ]` : body;
  const display = isolateFillInBlanks(
    stripTaskListCheckboxes(stripHtmlAnchorNoise(stripMasachNumberingForDisplay(raw))),
  );

  return (
    <div className="space-y-3">
      {truncated ? (
        <Text as="p" variant="bodySm" className="text-amber-900">
          הקובץ ארוך - מוצגים {MAX_CHARS.toLocaleString("he-IL")} תווים ראשונים.
        </Text>
      ) : null}
      <div
        dir="rtl"
        lang="he"
        className="max-w-readable rounded-surface border border-line/80 bg-paper p-4 text-ink shadow-inner sm:p-6"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={AMIRANT_COURSE_MD_COMPONENTS}>
          {display}
        </ReactMarkdown>
      </div>
    </div>
  );
}
