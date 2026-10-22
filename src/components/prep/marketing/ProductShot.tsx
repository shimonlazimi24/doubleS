import Image from "next/image";
import { cn } from "@/lib/design-system/cn";

/**
 * A real screenshot of the course, not a mock-up. The file is captured from
 * the live course page (public/prep/course-screenshot.jpg); re-capture it
 * when the course page changes.
 */
export function ProductShot({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <figure className={cn("w-full", className)}>
      <div className="overflow-hidden rounded border border-line bg-paper shadow-[0_1px_2px_rgba(15,35,71,0.06),0_12px_32px_-16px_rgba(15,35,71,0.25)]">
        <Image
          src="/prep/course-screenshot.jpg"
          alt="דף הקורס: תוכנית הקורס בצד, מודול השלמת משפטים פתוח עם מבחני התרגול לפי רמה"
          width={1446}
          height={840}
          priority={priority}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="h-auto w-full"
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted">דף הקורס כפי שהוא נראה ללומד</figcaption>
    </figure>
  );
}
