import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";

const pads = {
  none: "",
  md: "py-ds-8 md:py-ds-10",
  lg: "py-ds-10 md:py-ds-12",
  xl: "py-ds-12 md:py-ds-16",
} as const;

type Pad = keyof typeof pads;

type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  /** Vertical padding for the main content band */
  pad?: Pad;
};

/** Page content wrapper — vertical rhythm only (nav/footer live in layout). */
export function PageLayout({ children, pad = "md", className, ...props }: Props) {
  return (
    <div className={cn("min-w-0", pads[pad], className)} {...props}>
      {children}
    </div>
  );
}
