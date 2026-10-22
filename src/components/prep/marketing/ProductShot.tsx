import { existsSync } from "node:fs";
import path from "node:path";
import { cn } from "@/lib/design-system/cn";
import { HeroMedia } from "./HeroMedia";

const SCREENSHOT = "/prep/course-screenshot.jpg";
const VIDEO = "/prep/course-hero.mp4";

/**
 * A real screenshot of the course, not a mock-up; when public/prep/course-hero.mp4
 * exists it plays as a silent loop with the screenshot as its poster. Both files
 * are captured from the live course page; re-capture them when the page changes.
 * The file check runs at build time, so adding the video needs a deploy.
 */
export function ProductShot({ className, priority = false }: { className?: string; priority?: boolean }) {
  const hasVideo = existsSync(path.join(process.cwd(), "public", VIDEO));
  return (
    <figure className={cn("w-full", className)}>
      <div className="overflow-hidden rounded border border-line bg-paper shadow-[0_1px_2px_rgba(15,35,71,0.06),0_12px_32px_-16px_rgba(15,35,71,0.25)]">
        <HeroMedia
          poster={SCREENSHOT}
          video={hasVideo ? VIDEO : null}
          width={1446}
          height={840}
          priority={priority}
          alt="דף הקורס: תוכנית הקורס בצד, מודול השלמת משפטים פתוח עם מבחני התרגול לפי רמה"
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        {hasVideo ? "מבחן תרגול בקורס: בחירת תשובות, בדיקה והסבר, כפי שהלומד רואה" : "דף הקורס כפי שהוא נראה ללומד"}
      </figcaption>
    </figure>
  );
}
