import { cn } from "@/lib/design-system/cn";
import type { ReactNode } from "react";

type Props = {
  /** Desktop sticky sidebar (stepper) */
  sidebar: ReactNode;
  /** Optional compact stepper for mobile (above main column) */
  topMobile: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Two-column shell (sidebar + main) for lesson reading; mobile stacks with top rail.
 */
export function PremiumLessonShell({ sidebar, topMobile, children, className }: Props) {
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 lg:mb-0 lg:hidden">{topMobile}</div>
      <div className="grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="hidden self-start lg:sticky lg:top-20 lg:block">{sidebar}</aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
