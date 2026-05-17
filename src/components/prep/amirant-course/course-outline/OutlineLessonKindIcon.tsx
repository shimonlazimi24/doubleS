import type { OutlineLessonVisualKind } from "@/lib/amirant-course/course-outline-visual-kind";
import { cn } from "@/lib/design-system/cn";

type Props = {
  kind: OutlineLessonVisualKind;
  className?: string;
};

/** Compact 16px-style icons for outline rows (no external icon pack). */
export function OutlineLessonKindIcon({ kind, className }: Props) {
  const base = "h-4 w-4 shrink-0 opacity-90";
  switch (kind) {
    case "video":
      return (
        <svg className={cn(base, className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M8 5v14l11-7-11-7z" strokeLinejoin="round" />
        </svg>
      );
    case "quiz":
      return (
        <svg className={cn(base, className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" />
        </svg>
      );
    case "practice":
      return (
        <svg className={cn(base, className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" />
          <path d="M8 7h8M8 11h8M8 15h4" strokeLinecap="round" />
        </svg>
      );
    case "simulation":
      return (
        <svg className={cn(base, className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M4 12h2M18 12h2M12 4v2M12 18v2" strokeLinecap="round" />
        </svg>
      );
    case "reading":
    default:
      return (
        <svg className={cn(base, className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" />
          <path d="M8 7h8M8 11h6" strokeLinecap="round" />
        </svg>
      );
  }
}
