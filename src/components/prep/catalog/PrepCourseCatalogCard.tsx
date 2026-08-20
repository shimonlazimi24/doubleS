import Link from "next/link";
import type { PrepCourseCatalogItem } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";

/* כרטיס טקסטואלי נקי - בלי תמונות סטוק ובלי דירוגים מומצאים. */
export function PrepCourseCatalogCard({ course }: { course: PrepCourseCatalogItem }) {
  const comingSoon = course.status === "coming_soon";
  const href = comingSoon ? undefined : course.href;
  const price = course.priceFromIls != null ? `גישה מלאה החל מ-₪${course.priceFromIls}` : "בקרוב";

  const inner = (
    <article
      className={cn(
        "flex h-full flex-col rounded-surface border border-line bg-paper p-6 transition",
        !comingSoon && "hover:border-primary/40 hover:shadow-card",
        comingSoon && "opacity-85",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold tracking-wide",
          comingSoon ? "text-muted" : "text-accent",
        )}
      >
        {comingSoon ? "בקרוב" : "מבוא חינם · רכישה לגישה מלאה"}
      </p>
      <h3 className="mt-2 text-lg font-bold text-ink">{course.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{course.blurb}</p>
      <p className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold text-primary">
        <span>{price}</span>
      </p>
    </article>
  );

  if (comingSoon || !href) {
    return <div className="h-full cursor-default">{inner}</div>;
  }
  return (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  );
}
