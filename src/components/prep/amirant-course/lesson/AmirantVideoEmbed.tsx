/**
 * הטמעת סרטון בשיעור/סימולציה - YouTube / Vimeo / קובץ ישיר (Supabase Storage),
 * עם כרטיס placeholder כשעדיין אין סרטון (src ריק).
 */
import { cn } from "@/lib/design-system/cn";

type Props = {
  src: string | null | undefined;
  title: string;
  className?: string;
};

function youTubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{6,20})/) ??
    url.match(/youtube\.com\/shorts\/([\w-]{6,20})/);
  return m?.[1] ?? null;
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  return m?.[1] ?? null;
}

/**
 * תמיד מוגבל לעמודת הקריאה (52rem, ממורכז) - placeholder ברוחב מלא הפך
 * במסך רחב לקופסה ריקה בגובה ~1000px שדחפה את כל השיעור מתחת לקיפול.
 */
const COLUMN = "mx-auto w-full max-w-[52rem]";

export function AmirantVideoEmbed({ src, title, className }: Props) {
  const trimmed = src?.trim() || null;

  if (!trimmed) {
    // פס קומפקטי - לא קופסת aspect-video ריקה
    return (
      <div
        dir="rtl"
        className={cn(
          COLUMN,
          "flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface-low px-4 py-3",
          className,
        )}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm text-primary"
          aria-hidden
        >
          ▶
        </span>
        <p className="text-sm text-muted">סרטון הסבר בעברית יתווסף בקרוב</p>
      </div>
    );
  }

  const yt = youTubeId(trimmed);
  if (yt) {
    return (
      <div className={cn(COLUMN, "aspect-video overflow-hidden rounded-2xl border border-line/70 bg-black", className)}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}`}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  const vm = vimeoId(trimmed);
  if (vm) {
    return (
      <div className={cn(COLUMN, "aspect-video overflow-hidden rounded-2xl border border-line/70 bg-black", className)}>
        <iframe
          src={`https://player.vimeo.com/video/${vm}`}
          title={title}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // קובץ ישיר (למשל Supabase Storage / CDN)
  return (
    <div className={cn(COLUMN, "aspect-video overflow-hidden rounded-2xl border border-line/70 bg-black", className)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video src={trimmed} title={title} controls className="h-full w-full" preload="metadata" />
    </div>
  );
}
