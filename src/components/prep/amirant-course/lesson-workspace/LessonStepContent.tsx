import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "../lesson/ui/lesson-saas-tokens";
import type { WorkspaceStepKind } from "./workspace-step";

type Props = {
  kind: WorkspaceStepKind;
  children: ReactNode;
  className?: string;
  showTopLabel?: boolean;
  /** When set, replaces the default kind-based eyebrow (e.g. למידה מודרכת). */
  eyebrowText?: string;
};

const KIND_LABEL: Record<WorkspaceStepKind, string> = {
  intro: "מבוא",
  explanation: "הסבר",
  example: "דוגמה",
  tip: "טיפ",
  warning: "שים לב",
  quick_check: "בדיקה קצרה",
  inline_questions: "תרגול אינטראקטיבי",
  summary: "סיכום והמשך",
  practice_cta: "המשך",
  ai_help: "עזרה",
};

/** Step body; outer padding is provided by the workspace main column. */
export function LessonStepContent({
  kind,
  children,
  className,
  showTopLabel = true,
  eyebrowText,
}: Props) {
  const eyebrow = eyebrowText ?? KIND_LABEL[kind];
  return (
    <div className={cn(lessonSaaS.stepContent, "min-h-0", className)}>
      {showTopLabel ? <p className={lessonSaaS.eyebrow}>{eyebrow}</p> : null}
      <div className={cn("[direction:rtl] [text-align:start]", showTopLabel && "mt-2.5 sm:mt-3")}>{children}</div>
    </div>
  );
}
