import Image from "next/image";
import { PREP_BRAND_LATIN, PREP_LOGO_HEIGHT, PREP_LOGO_PATH, PREP_LOGO_WIDTH } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

const SIZES = {
  nav: { height: 36, className: "h-9 w-auto max-w-[9.5rem]" },
  footer: { height: 32, className: "h-8 w-auto max-w-[8.5rem]" },
  hero: { height: 56, className: "h-14 w-auto max-w-[15rem]" },
} as const;

type PrepBrandLogoSize = keyof typeof SIZES;

type Props = {
  size?: PrepBrandLogoSize;
  className?: string;
  priority?: boolean;
};

export function PrepBrandLogo({ size = "nav", className, priority }: Props) {
  const { height, className: sizeClass } = SIZES[size];
  const width = Math.round((height * PREP_LOGO_WIDTH) / PREP_LOGO_HEIGHT);

  return (
    <Image
      src={PREP_LOGO_PATH}
      alt={PREP_BRAND_LATIN}
      width={width}
      height={height}
      priority={priority}
      className={cn(sizeClass, "object-contain object-right", className)}
    />
  );
}
