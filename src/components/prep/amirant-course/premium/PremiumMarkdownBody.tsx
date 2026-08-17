import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AMIRANT_COURSE_MD_COMPONENTS,
  isHebrewDominantNode,
  isLatinDominantNode,
  needsLtrMarkdownProse,
} from "@/components/prep/amirant-course/AmirantCourseMarkdownFromRepo";
import type { Components } from "react-markdown";
import { cn } from "@/lib/design-system/cn";
import {
  isolateFillInBlanks,
  stripHtmlAnchorNoise,
  stripTaskListCheckboxes,
} from "@/lib/amirant-course/lesson-content/strip-lesson-markdown-noise";
import { AmirantVideoEmbed } from "@/components/prep/amirant-course/lesson/AmirantVideoEmbed";
import { AmirantAudioPlayer } from "@/components/prep/amirant-course/lesson/AmirantAudioPlayer";
import { splitBodyOnMediaShortcodes } from "@/lib/amirant-course/lesson-content/media-shortcodes";

const baseCompact: Components = {
  ...AMIRANT_COURSE_MD_COMPONENTS,
  p: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <p className="mb-2.5 text-sm leading-relaxed text-ink last:mb-0 [direction:ltr] [text-align:left]" lang="en">
        {children}
      </p>
    ) : (
      <p className="mb-2.5 text-sm leading-relaxed text-ink last:mb-0">{children}</p>
    ),
  ul: ({ children }) => (
    <ul className="mb-2.5 list-disc space-y-1 pr-5 text-sm text-ink marker:text-primary/80">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2.5 list-decimal space-y-1 pr-5 text-sm text-ink marker:font-medium">{children}</ol>
  ),
  h1: AMIRANT_COURSE_MD_COMPONENTS.h1!,
  h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-ink first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-ink">{children}</h4>,
  h4: AMIRANT_COURSE_MD_COMPONENTS.h4!,
  blockquote: AMIRANT_COURSE_MD_COMPONENTS.blockquote!,
  pre: AMIRANT_COURSE_MD_COMPONENTS.pre!,
  code: AMIRANT_COURSE_MD_COMPONENTS.code!,
  table: AMIRANT_COURSE_MD_COMPONENTS.table!,
  thead: AMIRANT_COURSE_MD_COMPONENTS.thead!,
  th: AMIRANT_COURSE_MD_COMPONENTS.th!,
  td: AMIRANT_COURSE_MD_COMPONENTS.td!,
  tr: AMIRANT_COURSE_MD_COMPONENTS.tr!,
  a: AMIRANT_COURSE_MD_COMPONENTS.a!,
  strong: AMIRANT_COURSE_MD_COMPONENTS.strong!,
  img: AMIRANT_COURSE_MD_COMPONENTS.img!,
  li: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <li className="text-sm leading-relaxed [direction:ltr] [text-align:left]" lang="en">
        {children}
      </li>
    ) : (
      <li className="text-sm leading-relaxed">{children}</li>
    ),
  hr: AMIRANT_COURSE_MD_COMPONENTS.hr!,
};

/** Lesson cards: tight prose; rich blocks get scroll/height so nothing turns into a full-page wall. */
const cardCompact: Components = {
  ...AMIRANT_COURSE_MD_COMPONENTS,
  p: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <p
        className="mb-2.5 text-sm leading-[1.55] text-slate-800 [overflow-wrap:anywhere] last:mb-0 [direction:ltr] [text-align:left] sm:text-sm"
        lang="en"
      >
        {children}
      </p>
    ) : (
      <p className="mb-2.5 text-sm leading-[1.55] text-slate-800 [overflow-wrap:anywhere] last:mb-0 sm:text-sm">{children}</p>
    ),
  ul: ({ children }) => (
    <ul className="mb-2.5 list-disc space-y-1 pr-4 text-sm text-slate-800 marker:text-slate-400 [overflow-wrap:anywhere]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2.5 list-decimal space-y-1 pr-4 text-sm text-slate-800 [overflow-wrap:anywhere]">{children}</ol>
  ),
  h1: AMIRANT_COURSE_MD_COMPONENTS.h1!,
  h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-semibold text-slate-900 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1 mt-2 text-xs font-semibold text-slate-800">{children}</h4>,
  h4: AMIRANT_COURSE_MD_COMPONENTS.h4!,
  blockquote: ({ children }) =>
    isLatinDominantNode(children) ? (
      // ציטוט/קטע אנגלי: LTR ויישור שמאל - אחרת הפיסוק קופץ לתחילת השורה
      <blockquote className="mb-2.5 max-w-none py-0.5 text-sm leading-[1.65] text-slate-700 [direction:ltr] [text-align:left] [overflow-wrap:anywhere]">
        {children}
      </blockquote>
    ) : (
      <blockquote className="mb-2.5 border-s-2 border-slate-200/80 ps-3 text-sm leading-[1.5] text-slate-700 [overflow-wrap:anywhere]">
        {children}
      </blockquote>
    ),
  pre: ({ children }) =>
    isHebrewDominantNode(children) ? (
      <pre className="mb-2.5 min-w-0 max-w-full whitespace-pre-wrap rounded-md border border-slate-200/80 bg-slate-50/90 p-2.5 font-sans text-sm leading-relaxed text-slate-800 [direction:rtl] [text-align:right] [overflow-wrap:anywhere]">
        {children}
      </pre>
    ) : (
      <pre className="mb-2.5 max-h-72 min-w-0 max-w-full overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200/80 bg-slate-50/90 p-2.5 text-start text-xs leading-relaxed text-slate-800 [direction:ltr] [overflow-wrap:anywhere] sm:text-xs">
        {children}
      </pre>
    ),
  code: AMIRANT_COURSE_MD_COMPONENTS.code!,
  table: ({ children }) => (
    // בלי תקרת גובה - טבלה קטומה באמצע שורה גרועה מטבלה ארוכה (משוב: "תעודת הזהות" נחתכה)
    <div className="mb-2.5 max-w-full overflow-x-auto rounded-md border border-slate-200/60 [direction:ltr]">
      <table className="w-full min-w-0 text-xs text-slate-800">{children}</table>
    </div>
  ),
  thead: AMIRANT_COURSE_MD_COMPONENTS.thead!,
  th: AMIRANT_COURSE_MD_COMPONENTS.th!,
  td: AMIRANT_COURSE_MD_COMPONENTS.td!,
  tr: AMIRANT_COURSE_MD_COMPONENTS.tr!,
  a: AMIRANT_COURSE_MD_COMPONENTS.a!,
  strong: AMIRANT_COURSE_MD_COMPONENTS.strong!,
  img: AMIRANT_COURSE_MD_COMPONENTS.img!,
  li: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <li className="text-sm leading-[1.5] [overflow-wrap:anywhere] [direction:ltr] [text-align:left]" lang="en">
        {children}
      </li>
    ) : (
      <li className="text-sm leading-[1.5] [overflow-wrap:anywhere]">{children}</li>
    ),
  hr: AMIRANT_COURSE_MD_COMPONENTS.hr!,
};

/** Premium guided lessons: 65ch body, calmer emphasis, clear hierarchy. */
const lessonProse: Components = {
  ...AMIRANT_COURSE_MD_COMPONENTS,
  p: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <p
        className="mb-3 max-w-[65ch] text-lg leading-8 text-slate-700 [text-wrap:pretty] last:mb-0 [direction:ltr] [text-align:left]"
        lang="en"
      >
        {children}
      </p>
    ) : (
      <p className="mb-3 max-w-[65ch] text-lg leading-8 text-slate-700 [text-wrap:pretty] last:mb-0">{children}</p>
    ),
  ul: ({ children }) => (
    <ul className="mb-3 max-w-[65ch] list-disc space-y-1.5 pr-5 text-lg leading-8 text-slate-700 marker:text-sky-600/60">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 max-w-[65ch] list-decimal space-y-1.5 pr-5 text-lg leading-8 text-slate-700 marker:font-medium">
      {children}
    </ol>
  ),
  h1: AMIRANT_COURSE_MD_COMPONENTS.h1!,
  h2: ({ children }) => (
    <h3 className="mb-2 mt-5 text-xl font-semibold text-[#0f2347] first:mt-0 [text-wrap:balance]">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-4 text-lg font-semibold text-[#0f2347] [text-wrap:balance]">{children}</h4>
  ),
  h4: AMIRANT_COURSE_MD_COMPONENTS.h4!,
  blockquote: ({ children }) =>
    isLatinDominantNode(children) ? (
      // קטע קריאה אנגלי (הבנת הנקרא): פאנל קריאה רגוע במקום כרטיס צבעוני -
      // LTR + יישור שמאל (הפיסוק נשבר בירושת RTL), רקע לבן-כמעט, קו-שיער שמאלי,
      // ריווח שורות נדיב ורוחב מלא של העמודה.
      <blockquote className="mb-3 max-w-none py-1 text-slate-800 [direction:ltr] [text-align:left] [&_li]:max-w-none [&_ol]:max-w-none [&_p]:max-w-none [&_p]:leading-[1.9] [&_ul]:max-w-none">
        {children}
      </blockquote>
    ) : (
      <blockquote className="mb-3 max-w-[65ch] rounded-2xl border border-sky-100/90 bg-sky-50/35 px-4 py-3 text-lg leading-8 text-slate-800 sm:px-5">
        {children}
      </blockquote>
    ),
  pre: AMIRANT_COURSE_MD_COMPONENTS.pre!,
  code: AMIRANT_COURSE_MD_COMPONENTS.code!,
  table: ({ children }) => (
    <div className="mb-3 max-w-[65ch] overflow-x-auto rounded-2xl border border-stone-200/70 [direction:ltr]">
      <table className="w-full min-w-0 text-sm text-slate-800">{children}</table>
    </div>
  ),
  thead: AMIRANT_COURSE_MD_COMPONENTS.thead!,
  th: AMIRANT_COURSE_MD_COMPONENTS.th!,
  td: AMIRANT_COURSE_MD_COMPONENTS.td!,
  tr: AMIRANT_COURSE_MD_COMPONENTS.tr!,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-sky-800 underline-offset-2 hover:underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-medium text-slate-800">{children}</strong>,
  img: AMIRANT_COURSE_MD_COMPONENTS.img!,
  li: ({ children }) =>
    needsLtrMarkdownProse(children) ? (
      <li className="text-lg leading-8 [text-wrap:pretty] [direction:ltr] [text-align:left]" lang="en">
        {children}
      </li>
    ) : (
      <li className="text-lg leading-8 [text-wrap:pretty]">{children}</li>
    ),
  hr: () => <hr className="mb-3 max-w-[65ch] border-0 border-t border-stone-200/80" />,
};

type Props = { body: string; className?: string; variant?: "default" | "card" | "lesson" };

export function PremiumMarkdownBody({ body, className, variant = "default" }: Props) {
  const cleanBody = isolateFillInBlanks(stripTaskListCheckboxes(stripHtmlAnchorNoise(body)));
  if (!cleanBody.trim()) {
    return null;
  }
  const c = variant === "card" ? cardCompact : variant === "lesson" ? lessonProse : baseCompact;
  const segments = splitBodyOnMediaShortcodes(cleanBody);
  return (
    <div
      className={cn(
        "max-w-none [text-align:start]",
        variant === "card" ? "" : variant === "lesson" ? "" : "max-w-readable [&_p]:max-w-[60ch] [&_p]:leading-[1.65]",
        className,
      )}
      dir="rtl"
      lang="he"
    >
      {segments.map((seg, i) => {
        if (seg.kind === "video") {
          return <AmirantVideoEmbed key={`video-${i}`} src={seg.src} title={seg.title} className="my-4" />;
        }
        if (seg.kind === "audio") {
          return (
            <AmirantAudioPlayer
              key={`audio-${i}`}
              audioRef={seg.ref}
              title={seg.title}
              className="my-4"
            />
          );
        }
        return seg.value.trim() ? (
          <ReactMarkdown key={`md-${i}`} remarkPlugins={[remarkGfm]} components={c}>
            {seg.value}
          </ReactMarkdown>
        ) : null;
      })}
    </div>
  );
}
