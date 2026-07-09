import type { HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";
import { containerPaddingX } from "@/lib/design-system/spacing";

const maxMap = {
  shell: "max-w-shell",
  measure: "max-w-measure",
  /** מאמרים וסילבוס ארוך - עמודות רחבות יחסית ל-measure */
  measureWide: "max-w-[52rem]",
  readable: "max-w-readable",
} as const;

export type ContainerMax = keyof typeof maxMap;

type Props = HTMLAttributes<HTMLDivElement> & {
  /** Content width cap (default: product shell). */
  max?: ContainerMax;
};

/** Centered content column with horizontal gutters and max width. */
export function Container({ max = "shell", className, ...props }: Props) {
  return <div className={cn("mx-auto w-full", maxMap[max], containerPaddingX, className)} {...props} />;
}
