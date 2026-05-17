import { PrepBrandLogo } from "@/components/prep/PrepBrandLogo";
import { PREP_BRAND_NAV_HE } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Show Hebrew tagline under the logo image */
  showTagline?: boolean;
  priority?: boolean;
};

const logoSize = {
  sm: "nav",
  md: "footer",
  lg: "hero",
} as const;

const taglineSize = {
  sm: "text-[0.625rem]",
  md: "text-[0.6875rem]",
  lg: "text-xs",
} as const;

/** Logo image + optional Hebrew tagline (used in header, footer, marketing). */
export function BrandWordmark({
  size = "md",
  className,
  showTagline = true,
  priority,
}: Props) {
  return (
    <div
      dir="ltr"
      className={cn("inline-flex flex-col items-start justify-center leading-none", className)}
    >
      <PrepBrandLogo size={logoSize[size]} priority={priority} align="start" />
      {showTagline ? (
        <span dir="rtl" className={cn(taglineSize[size], "mt-1.5 font-medium text-muted")}>
          {PREP_BRAND_NAV_HE}
        </span>
      ) : null}
    </div>
  );
}
