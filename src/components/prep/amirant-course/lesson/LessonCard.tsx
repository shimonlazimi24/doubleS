import { cn } from "@/lib/design-system/cn";
import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string; id?: string; as?: "div" | "section" | "article" };

/** Base shell — rounded card, professional spacing. */
export function LessonCard({ children, className, id, as: C = "div" }: Props) {
  return (
    <C id={id} className={cn("rounded-2xl border p-5 sm:p-6 md:p-8", className)} dir="rtl" lang="he">
      {children}
    </C>
  );
}
