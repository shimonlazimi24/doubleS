import type { HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";

const tones = {
  paper: "bg-paper",
  canvas: "bg-canvas",
  surfaceLow: "bg-surface-low",
  ink: "bg-ink text-paper",
} as const;

type Tone = keyof typeof tones;

type Props = HTMLAttributes<HTMLElement> & {
  tone: Tone;
  /** Vertical padding using design-system scale */
  padding?: "default" | "loose" | "none";
};

const paddingClass = {
  default: "py-ds-10 md:py-ds-12",
  loose: "py-ds-12 md:py-ds-16",
  none: "",
} as const;

/** Full-bleed section with tonal background. */
export function Section({ tone, padding = "default", className, id, ...props }: Props) {
  return (
    <section id={id} className={cn(tones[tone], paddingClass[padding], className)} {...props} />
  );
}
