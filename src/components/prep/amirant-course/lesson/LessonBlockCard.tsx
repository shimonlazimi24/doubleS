import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "./ui/lesson-saas-tokens";
import { getLessonBlockPresentation } from "./lessonBlockPresentation";
import { LessonBlockIcon } from "./LessonBlockIcons";
import { PremiumMarkdownBody } from "../premium/PremiumMarkdownBody";

export type LessonBlockCardProps = {
  title: string;
  variant: PremiumSectionVariant;
  body?: string;
  items?: string[];
  bullets?: string[];
  className?: string;
  /**
   * When several cards sit in one section, use one outer frame; rows share dividers instead of stacked full borders.
   */
  sectionStack?: { index: number; total: number };
  /**
   * `bodyOnly` — no card title h2; use when the page already shows the section heading.
   * `workspaceFlat` — one reading surface: no inner bordered card, no icon box (avoids “card in card”).
   */
  contentMode?: "full" | "bodyOnly" | "workspaceFlat";
};

/**
 * One card = one short idea. Body is a single chunk (parent splits long sections into multiple cards).
 */
export function LessonBlockCard({
  title,
  variant,
  body,
  items,
  bullets,
  className,
  sectionStack,
  contentMode = "full",
}: LessonBlockCardProps) {
  const p = getLessonBlockPresentation(variant);
  const stack = sectionStack && sectionStack.total > 1;
  const i = sectionStack?.index ?? 0;
  const n = sectionStack?.total ?? 1;
  const isFlat = contentMode === "workspaceFlat";
  const showCardTitle = contentMode === "full";
  const mdClassName = isFlat ? "max-w-[65ch]" : "[&_p]:text-inherit";
  const mdVariant = isFlat ? "lesson" : "card";

  const inner = (
    <>
      <header>
        <Text
          as="p"
          variant="caption"
          className={cn(
            isFlat ? "text-sm font-semibold sm:text-base" : "text-xs font-medium uppercase tracking-wide sm:text-sm",
            p.labelColor,
          )}
        >
          {p.label}
        </Text>
        {showCardTitle ? <h2 className={cn(lessonSaaS.h2, "mt-2.5", p.titleClass)}>{title}</h2> : null}
      </header>
      {body?.trim() ? (
        <div className={cn("text-base leading-relaxed text-gray-600 sm:text-lg", isFlat && "mt-3 sm:mt-4")}>
          <PremiumMarkdownBody body={body} variant={mdVariant} className={mdClassName} />
        </div>
      ) : null}
      {items && items.length > 0 ? (
        <ul
          className={cn(
            "list-disc space-y-2.5 pr-4 text-base leading-relaxed text-gray-600 marker:text-gray-300 [overflow-wrap:anywhere] sm:text-lg",
            isFlat && (body?.trim() ? "mt-4" : "mt-3"),
          )}
        >
          {items.map((it, j) => (
            <li key={j} className="[overflow-wrap:anywhere]" title={it.length > 120 ? it : undefined}>
              {it}
            </li>
          ))}
        </ul>
      ) : null}
      {bullets && bullets.length > 0 && !items ? (
        <ul
          className={cn(
            "list-disc space-y-2.5 pr-4 text-base leading-relaxed text-gray-600 marker:text-gray-300 [overflow-wrap:anywhere] sm:text-lg",
            isFlat && (body?.trim() ? "mt-4" : "mt-3"),
          )}
        >
          {bullets.map((x, j) => (
            <li key={j} className="[overflow-wrap:anywhere]" title={x.length > 120 ? x : undefined}>
              {x}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  if (isFlat) {
    return (
      <article className={cn("border-0 bg-transparent p-0 shadow-none", className)} dir="rtl" lang="he">
        <div className="min-w-0 space-y-4 [text-align:start]">{inner}</div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden",
        p.box,
        stack &&
          cn(
            "!border-0 !shadow-none !ring-0",
            i === 0 ? "rounded-t-2xl rounded-b-none" : "rounded-t-none",
            i === n - 1 ? "rounded-b-2xl" : "rounded-b-none",
          ),
        className,
      )}
      dir="rtl"
      lang="he"
    >
      <div className="flex flex-wrap items-start gap-4 sm:gap-5">
        <span className={p.iconWrap} aria-hidden>
          <LessonBlockIcon variant={variant} />
        </span>
        <div className="min-w-0 flex-1 space-y-4 [text-align:start]">{inner}</div>
      </div>
    </article>
  );
}
