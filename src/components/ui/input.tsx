import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/design-system/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  /** `onDark` for footer / inverted bands */
  variant?: "default" | "onDark";
};

export function Input({ className, variant = "default", ...props }: Props) {
  return (
    <input
      className={cn(
        "w-full rounded-control border bg-paper px-ds-3 py-ds-2 text-sm text-ink shadow-card transition focus:outline-none focus:ring-2 focus:ring-primary/25",
        variant === "default" && "border-line placeholder:text-muted-2 focus:border-primary",
        variant === "onDark" &&
          "border-white/15 bg-white/5 text-paper placeholder:text-muted-2 focus:border-white/30 focus:ring-primary/35",
        className,
      )}
      {...props}
    />
  );
}
