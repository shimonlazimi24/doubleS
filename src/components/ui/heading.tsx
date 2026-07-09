import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";

/** Default scale: semantic document hierarchy (H1 = inner page title). */
const levelStyles = {
  1: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-[2.125rem]",
  2: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl",
  3: "font-display text-xl font-semibold leading-snug text-ink md:text-2xl",
  4: "font-display text-lg font-semibold leading-snug text-ink",
} as const;

/** Marketing hero only - dominant display. */
const heroPreset =
  "font-display text-[2.25rem] font-semibold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl";

export type HeadingLevel = keyof typeof levelStyles;

type Props = {
  as?: ElementType;
  level: HeadingLevel;
  /** `hero` applies only when `level` is 1. */
  preset?: "default" | "hero";
} & HTMLAttributes<HTMLElement>;

export function Heading({ as, level, preset = "default", className, ...props }: Props) {
  const Comp = as ?? (`h${level}` as ElementType);
  const base = preset === "hero" && level === 1 ? heroPreset : levelStyles[level];
  return <Comp className={cn(base, className)} {...props} />;
}
