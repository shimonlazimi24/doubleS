import Image from "next/image";
import Link from "next/link";
import type { PrepCourseCatalogItem } from "@/lib/prep/brand";
import { cn } from "@/lib/design-system/cn";
import {
  STITCH_HOME_BENTO_LARGE,
  STITCH_HOME_BENTO_SMALL_A,
} from "@/lib/prep/stitch-home-assets";

const IMAGES: Record<PrepCourseCatalogItem["imageKey"], string> = {
  amirant: STITCH_HOME_BENTO_SMALL_A,
  toefl: STITCH_HOME_BENTO_LARGE,
};

export function PrepCourseCatalogCard({ course }: { course: PrepCourseCatalogItem }) {
  const comingSoon = course.status === "coming_soon";
  const href = comingSoon ? undefined : course.href;
  const price =
    course.priceFromIls != null ? `החל מ-₪${course.priceFromIls}` : comingSoon ? "בקרוב" : "חינם / לפי מנוי";

  const inner = (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-surface border border-line bg-paper shadow-card transition",
        !comingSoon && "hover:border-primary/40 hover:shadow-card-hover",
        comingSoon && "opacity-90",
      )}
    >
      <div className="relative aspect-[16/10] w-full bg-surface-low">
        <Image src={IMAGES[course.imageKey]} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
        {comingSoon && (
          <span className="absolute start-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-paper">
            בקרוב
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 text-right">
        <h3 className="text-lg font-bold text-ink">{course.title}</h3>
        {course.rating != null && course.reviewCount != null && (
          <p className="mt-1 text-sm text-muted">
            ★ {course.rating.toFixed(1)} ({course.reviewCount})
          </p>
        )}
        <p className="mt-auto pt-3 text-sm font-semibold text-primary">{price}</p>
      </div>
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
