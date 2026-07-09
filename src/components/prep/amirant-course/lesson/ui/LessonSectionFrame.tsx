import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "./lesson-saas-tokens";

type Props = {
  /** Section heading - adds hierarchy without duplicating card chrome. */
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Named section wrapper with spacing (between groups of cards).
 */
export function LessonSectionFrame({ title, eyebrow, children, className }: Props) {
  return (
    <section className={cn("mb-8 sm:mb-10", className)} dir="rtl" lang="he">
      {title ? (
        <div className="mb-5 border-b border-gray-100 pb-3">
          {eyebrow ? <p className={lessonSaaS.eyebrow}>{eyebrow}</p> : null}
          <h2 className={cn(lessonSaaS.h2, eyebrow && "mt-1")}>{title}</h2>
        </div>
      ) : null}
      <div className={cn(lessonSaaS.blockGap)}>{children}</div>
    </section>
  );
}
