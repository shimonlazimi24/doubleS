import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";
import { typography, type TypographyRole } from "@/lib/design-system/typography";

type Props = {
  as?: ElementType;
  variant: TypographyRole;
} & HTMLAttributes<HTMLElement>;

/** Semantic text styles from the design system. */
export function Text({ as: Comp = "p", variant, className, ...props }: Props) {
  return <Comp className={cn(typography[variant], className)} {...props} />;
}
