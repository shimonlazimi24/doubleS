import { cn } from "@/lib/design-system/cn";

export const buttonBase =
  "inline-flex items-center justify-center rounded-control text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50";

export const buttonVariantClass = {
  primary: cn(
    buttonBase,
    "bg-primary px-ds-3 py-ds-2 text-white shadow-cta hover:bg-primary-hover",
  ),
  secondary: cn(
    buttonBase,
    "border border-line bg-paper px-ds-3 py-ds-2 text-ink shadow-card hover:bg-surface-low",
  ),
  ghost: cn(buttonBase, "px-ds-2 py-ds-1 text-primary hover:bg-primary-muted hover:text-primary-hover"),
} as const;

export type ButtonVariant = keyof typeof buttonVariantClass;
