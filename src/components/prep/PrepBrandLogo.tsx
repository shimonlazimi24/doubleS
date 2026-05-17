import Image from "next/image";
import { PREP_BRAND_LATIN, PREP_LOGO_HEIGHT, PREP_LOGO_PATH, PREP_LOGO_WIDTH } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

const SIZES = {
  nav: {
    height: 40,
    className: "h-10 w-[11.25rem] max-w-[min(100%,11.25rem)]",
    sizes: "180px",
  },
  footer: {
    height: 36,
    className: "h-9 w-[10rem] max-w-[min(100%,10rem)]",
    sizes: "160px",
  },
  hero: {
    height: 52,
    className: "h-[3.25rem] w-[14.5rem] max-w-[min(100%,14.5rem)]",
    sizes: "232px",
  },
} as const;

type PrepBrandLogoSize = keyof typeof SIZES;

type Props = {
  size?: PrepBrandLogoSize;
  className?: string;
  priority?: boolean;
  /** Physical alignment of the wordmark inside its box (use start for left in LTR bars). */
  align?: "start" | "end";
};

export function PrepBrandLogo({
  size = "nav",
  className,
  priority,
  align = "start",
}: Props) {
  const spec = SIZES[size];
  const width = Math.round((spec.height * PREP_LOGO_WIDTH) / PREP_LOGO_HEIGHT);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        align === "start" ? "justify-start" : "justify-end",
        className,
      )}
      dir="ltr"
    >
      <Image
        src={PREP_LOGO_PATH}
        alt={PREP_BRAND_LATIN}
        width={width}
        height={spec.height}
        priority={priority}
        sizes={spec.sizes}
        className={cn(
          spec.className,
          "object-contain",
          align === "start" ? "object-left" : "object-right",
        )}
      />
    </span>
  );
}
