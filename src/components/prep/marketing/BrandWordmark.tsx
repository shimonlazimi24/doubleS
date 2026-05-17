import { PREP_BRAND_LATIN, PREP_BRAND_NAV_HE } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { name: "text-lg", tag: "text-[0.625rem]" },
  md: { name: "text-xl md:text-2xl", tag: "text-[0.6875rem]" },
  lg: { name: "text-2xl md:text-3xl", tag: "text-xs" },
} as const;

export function BrandWordmark({ size = "md", className }: Props) {
  const s = sizes[size];
  return (
    <div
      dir="ltr"
      className={cn("inline-flex flex-col items-start justify-center leading-none", className)}
    >
      <span
        className={cn(
          s.name,
          "font-semibold tracking-tight text-primary",
        )}
      >
        {PREP_BRAND_LATIN}
      </span>
      <span
        dir="rtl"
        className={cn(s.tag, "mt-1 font-medium text-muted")}
      >
        {PREP_BRAND_NAV_HE}
      </span>
    </div>
  );
}
