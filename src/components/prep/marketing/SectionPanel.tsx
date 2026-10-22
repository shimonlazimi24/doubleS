import type { HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";

/**
 * A bounded white surface for a table or a list, so rows do not run as bare
 * hairlines across the whole page. One panel per block; nothing nested inside.
 */
export function SectionPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-hidden rounded-surface border border-line bg-paper shadow-[0_1px_2px_rgba(15,35,71,0.04),0_8px_24px_-12px_rgba(15,35,71,0.12)]", className)}
      {...props}
    />
  );
}
