import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "./lesson-saas-tokens";

type Props = {
  children: ReactNode;
  className?: string;
  /** Tighter vertical gap */
  compact?: boolean;
  dir?: "rtl" | "ltr";
  lang?: string;
};

/**
 * Centered max-width reading column; generous vertical rhythm.
 */
export function LessonContainer({ children, className, compact, dir, lang }: Props) {
  return (
    <div
      className={cn(lessonSaaS.container, compact ? "space-y-6" : "space-y-8 sm:space-y-10", className)}
      dir={dir}
      lang={lang}
    >
      {children}
    </div>
  );
}
