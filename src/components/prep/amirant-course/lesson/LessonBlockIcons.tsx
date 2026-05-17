import type { ReactNode } from "react";
import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";

const iconClass = "h-4 w-4 shrink-0 text-current opacity-80";

function BookOpen() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ListOrdered() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <line x1="10" x2="21" y1="6" y2="6" strokeLinecap="round" />
      <line x1="10" x2="21" y1="12" y2="12" strokeLinecap="round" />
      <line x1="10" x2="21" y1="18" y2="18" strokeLinecap="round" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M4 16h2" />
    </svg>
  );
}

/** Subtle “focus / insight” mark — not a literal object illustration. */
function InsightMark() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

function Info() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function AlertTriangle() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function XCircle() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" x2="9" y1="9" y2="15" strokeLinecap="round" />
      <line x1="9" x2="15" y1="9" y2="15" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

const ICONS: Record<PremiumSectionVariant, () => ReactNode> = {
  explanation: BookOpen,
  example: ListOrdered,
  insight: InsightMark,
  tip: Info,
  warning: AlertTriangle,
  "common-mistake": XCircle,
  "key-takeaway": CheckCircle,
};

export function LessonBlockIcon({ variant }: { variant: PremiumSectionVariant }): ReactNode {
  const Icon = ICONS[variant] ?? BookOpen;
  return <Icon />;
}
