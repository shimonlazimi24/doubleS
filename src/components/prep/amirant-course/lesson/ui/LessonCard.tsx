import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "./lesson-saas-tokens";

type Props = { children: ReactNode; className?: string; as?: "div" | "article" | "section" };

/** Base card shell - single consistent surface across the lesson. */
export function LessonCard({ children, className, as: Tag = "div" }: Props) {
  return <Tag className={cn(lessonSaaS.card, className)}>{children}</Tag>;
}
