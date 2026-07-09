import { cn } from "@/lib/design-system/cn";
import type { ReactNode } from "react";

type Props = {
  id?: string;
  className?: string;
  children: ReactNode;
  /** When set, adds a clear section label above children (hierarchy, not a second card). */
  title?: string;
  eyebrow?: string;
};

/**
 * Constrained, centered column - matches premium lesson max width (1000px).
 */
export function LessonSection({ id, className, children, title, eyebrow }: Props) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-[1000px] px-4 sm:px-6", className)} dir="rtl" lang="he">
      {title ? (
        <div className="mb-6 border-b border-gray-100/90 pb-4 sm:mb-8">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{eyebrow}</p>
          ) : null}
          <h2 className={cn("text-lg font-medium text-gray-900", eyebrow && "mt-1.5")}>{title}</h2>
        </div>
      ) : null}
      {children}
    </section>
  );
}
