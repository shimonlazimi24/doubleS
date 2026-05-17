import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "./lesson-saas-tokens";

export type LessonVariant = "default" | "tip" | "warning" | "example";

type Props = { variant: LessonVariant; children: ReactNode; className?: string; as?: "div" | "article" | "section" };

const surface: Record<LessonVariant, string> = {
  default: "border-gray-200 bg-white",
  tip: "border-blue-100 bg-blue-50/80",
  warning: "border-orange-100 bg-orange-50/80",
  example: "border-gray-200 bg-gray-50/90",
};

/**
 * Calm color wash for tip / warning / example; default stays white.
 */
export function LessonVariantCard({ variant, children, className, as: Tag = "div" }: Props) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8",
        surface[variant],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Class string for composing inside markdown cards when not using the wrapper. */
export function getLessonVariantCardClass(v: LessonVariant): string {
  return cn("rounded-2xl border p-6 shadow-sm sm:p-8 [direction:rtl] [text-align:start]", surface[v]);
}
