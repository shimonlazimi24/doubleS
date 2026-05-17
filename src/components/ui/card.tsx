import type { HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";

const variants = {
  default: "bg-paper shadow-card ring-1 ring-line/50",
  outline: "bg-paper shadow-none ring-1 ring-line/60",
  muted: "bg-surface-low shadow-none ring-1 ring-line/50",
} as const;

const paddings = {
  none: "p-0",
  sm: "p-ds-4",
  md: "p-ds-6",
  lg: "p-ds-8",
} as const;

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variants;
  padding?: keyof typeof paddings;
  /** Slight lift on hover (links / tiles) */
  interactive?: boolean;
};

export function Card({
  variant = "default",
  padding = "md",
  interactive,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-surface",
        variants[variant],
        paddings[padding],
        interactive && "transition hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

type CardTitleProps = HTMLAttributes<HTMLDivElement>;

/** `div` so titles can sit inside links without nested headings. */
export function CardTitle({ className, ...props }: CardTitleProps) {
  return <div className={cn("font-display text-lg font-semibold leading-snug text-ink", className)} {...props} />;
}

type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn("mt-ds-2 text-sm leading-body text-muted", className)} {...props} />;
}
