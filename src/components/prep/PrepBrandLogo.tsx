import { PREP_BRAND_SUBTITLE_HE, PREP_BRAND_WORDMARK } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

/**
 * הוורדמארק הטיפוגרפי של PREPARE - מקור אחד להדר, לפוטר ולמסכי שיווק.
 * יהלום ◈ (המוטיב מכותרת הקורס) + PREPARE במרווח אותיות רחב, טו-טון מאופק:
 * PRE בנייבי (primary), PARE בכחול-דיו (accent). בלי תמונות ובלי פונטים חדשים.
 */
const SIZES = {
  nav: {
    mark: "text-[1.0625rem] tracking-[0.18em]",
    diamond: "h-[0.75rem] w-[0.75rem]",
    gap: "gap-x-2",
    he: "mt-1.5 text-[0.625rem]",
  },
  footer: {
    mark: "text-xl tracking-[0.16em]",
    diamond: "h-[0.875rem] w-[0.875rem]",
    gap: "gap-x-2",
    he: "mt-1.5 text-[0.6875rem]",
  },
  hero: {
    mark: "text-2xl tracking-[0.16em] md:text-[1.75rem]",
    diamond: "h-4 w-4",
    gap: "gap-x-2.5",
    he: "mt-2 text-xs",
  },
} as const;

type Props = {
  size?: keyof typeof SIZES;
  className?: string;
  /** השורה העברית המושתקת מתחת לוורדמארק. */
  showTagline?: boolean;
};

/** יהלום המותג: טבעת נייבי, רווח נייר וליבת accent - הד לגליף ◈ שבתוך הקורס. */
function BrandDiamond({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={cn("shrink-0", className)}>
      <path d="M6 0 12 6 6 12 0 6Z" className="fill-primary" />
      <path d="M6 3.05 8.95 6 6 8.95 3.05 6Z" className="fill-paper" />
      <path d="M6 4.55 7.45 6 6 7.45 4.55 6Z" className="fill-accent" />
    </svg>
  );
}

export function PrepBrandLogo({ size = "nav", className, showTagline = true }: Props) {
  const s = SIZES[size];
  return (
    <span dir="ltr" className={cn("inline-flex flex-col items-start leading-none", className)}>
      <span className={cn("inline-flex items-center", s.gap)}>
        <BrandDiamond className={s.diamond} />
        <span className={cn("font-brand font-semibold uppercase", s.mark)}>
          <span aria-hidden className="text-primary">
            PRE
          </span>
          <span aria-hidden className="text-accent">
            PARE
          </span>
          <span className="sr-only">{PREP_BRAND_WORDMARK}</span>
        </span>
      </span>
      {showTagline ? (
        <span dir="rtl" className={cn("font-medium text-muted", s.he)}>
          {PREP_BRAND_SUBTITLE_HE}
        </span>
      ) : null}
    </span>
  );
}
