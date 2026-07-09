import {
  PREP_BRAND_SUBTITLE_HE,
  PREP_BRAND_WORDMARK,
  PREP_BRAND_WORDMARK_EN,
} from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
  showEnLine?: boolean;
};

const sizes = {
  sm: {
    mark: "text-[1.05rem] tracking-[0.16em]",
    en: "text-[0.5rem] tracking-[0.08em]",
    he: "text-[0.625rem]",
  },
  md: {
    mark: "text-xl tracking-[0.14em]",
    en: "text-[0.5625rem] tracking-[0.1em]",
    he: "text-[0.6875rem]",
  },
  lg: {
    mark: "text-2xl md:text-[1.75rem] tracking-[0.12em]",
    en: "text-[0.625rem] tracking-[0.12em]",
    he: "text-xs",
  },
} as const;

/** Vector-style typography logo - no raster image. */
export function BrandWordmark({
  size = "md",
  className,
  showSubtitle = true,
  showEnLine = size !== "sm",
}: Props) {
  const s = sizes[size];
  return (
    <div
      dir="ltr"
      className={cn("inline-flex flex-col items-start justify-center leading-none", className)}
    >
      <span
        className={cn(
          "font-brand font-semibold text-primary",
          s.mark,
        )}
      >
        {PREP_BRAND_WORDMARK}
      </span>
      {showEnLine ? (
        <span className={cn("mt-1 font-brand font-medium uppercase text-muted-2", s.en)}>
          {PREP_BRAND_WORDMARK_EN}
        </span>
      ) : null}
      {showSubtitle ? (
        <span dir="rtl" className={cn("mt-1.5 font-medium text-muted", s.he)}>
          {PREP_BRAND_SUBTITLE_HE}
        </span>
      ) : null}
    </div>
  );
}
