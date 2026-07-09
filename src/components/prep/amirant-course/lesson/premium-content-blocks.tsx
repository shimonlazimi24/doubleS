import type { ReactNode } from "react";
import { PremiumMarkdownBody } from "../premium/PremiumMarkdownBody";
import { cn } from "@/lib/design-system/cn";
import {
  amirantPremiumCard,
  amirantPremiumCardMuted,
  amirantPremiumTypo,
} from "./amirant-premium-typography";
import type { ExamQuestionTypeRow } from "@/lib/amirant-course/lesson-content/welcome-premium-extract";

type ScoreRow = { range: string; meaning: string; detail: string };

/** Pull quote / important callout - sky-tinted, no heavy shadow. */
export function LearningHighlight({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <div className={cn(amirantPremiumCardMuted, "border-sky-200/50")}>
      <PremiumMarkdownBody
        body={text}
        variant="lesson"
        className="[&_p]:!text-base [&_p]:!leading-7 sm:[&_p]:!text-lg"
      />
    </div>
  );
}

/** One-line or short key point - use when not duplicating body «מה לקחת» */
export function KeyTakeawayLine({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-stone-50/50 px-4 py-3 sm:px-5 sm:py-4 [direction:rtl] [text-align:start]",
        amirantPremiumTypo.body,
      )}
    >
      {children}
    </div>
  );
}

export function ChecklistBlock({
  title,
  items,
  asNumbers,
}: {
  title?: string;
  items: string[];
  asNumbers?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-3 [direction:rtl] [text-align:start]">
      {title ? <h3 className={amirantPremiumTypo.sectionTitle}>{title}</h3> : null}
      <ul className="space-y-2.5" role="list">
        {items.map((it, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-2.5 [text-align:start]",
              amirantPremiumTypo.body,
              asNumbers && "rounded-2xl border border-stone-200/60 bg-stone-50/40 p-3.5 sm:p-4",
            )}
          >
            <span className="shrink-0 text-slate-400" aria-hidden>
              {asNumbers ? `${i + 1}.` : "·"}
            </span>
            <span className="min-w-0">
              {asNumbers && (it.includes("**") || it.includes("`")) ? (
                <PremiumMarkdownBody body={it} variant="lesson" className="!inline" />
              ) : (
                it
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScoreRangeCards({ rows }: { rows: ScoreRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="grid gap-2.5 sm:grid-cols-1" role="list" aria-label="סולם ציונים">
      {rows.map((r, i) => (
        <div
          key={i}
          role="listitem"
          className={cn(amirantPremiumCard, "bg-stone-50/30")}
        >
          <p className={cn(amirantPremiumTypo.labelSky, "text-sm normal-case !tracking-tight !text-sky-900/85")}>
            {r.range.replace(/\*\*/g, "")}
          </p>
          <p className="mt-2 text-lg leading-8 text-slate-800 [text-align:start] [text-wrap:pretty]">
            {r.meaning}
            {r.detail ? <span className="text-slate-600"> · {r.detail}</span> : null}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Exam question-type rows: compact cards instead of HTML table. */
export function ExamStructureCards({ title, rows }: { title: string; rows: ExamQuestionTypeRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="space-y-3 [direction:rtl] [text-align:start]">
      <h3 className={amirantPremiumTypo.sectionTitle}>{title}</h3>
      <ul className="grid gap-2.5" role="list" aria-label={title}>
        {rows.map((r) => (
          <li
            key={r.n}
            className={cn(
              "flex flex-col gap-1.5 border border-stone-200/80 bg-stone-50/25 p-3.5 sm:flex-row sm:items-baseline sm:gap-4 sm:p-4",
              "rounded-2xl [text-align:start]",
            )}
            role="listitem"
          >
            <span className="shrink-0 font-medium text-slate-500 sm:w-8">{r.n}</span>
            <span className="min-w-0 flex-1 text-lg leading-7 text-slate-800 [text-wrap:pretty]">{r.type}</span>
            <span className="shrink-0 text-sm text-slate-600 sm:text-base">
              {r.count}
              {r.time ? <span className="ms-1 text-slate-500">· {r.time}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function stripBoldMarkers(s: string) {
  return s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

export function CourseIncludesGrid({
  units,
  bonusTitle,
  bonusItems,
}: {
  units: { n: string; title: string }[];
  bonusTitle: string;
  bonusItems: string[];
}) {
  return (
    <div className="space-y-8 [direction:rtl] [text-align:start]">
      <h3 className={amirantPremiumTypo.sectionTitle}>10 יחידות לימוד מובנות</h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="list" aria-label="רשימת יחידות">
        {units.map((u) => (
          <div
            key={u.n}
            className="rounded-2xl border border-stone-200/85 bg-white p-4 [text-align:start] sm:p-4"
            role="listitem"
          >
            <p className={amirantPremiumTypo.labelSky}>
              {u.n} מתוך 10
            </p>
            <p className="mt-1.5 text-lg leading-7 text-slate-800 [text-wrap:pretty]">
              {u.title.includes("**") ? (
                <PremiumMarkdownBody body={u.title} variant="lesson" className="!inline !max-w-none" />
              ) : (
                stripBoldMarkers(u.title)
              )}
            </p>
          </div>
        ))}
      </div>
      {bonusItems.length ? (
        <div>
          <h3 className={cn(amirantPremiumTypo.sectionTitle, "mb-3")}>{bonusTitle}</h3>
          <ul className="space-y-2" role="list">
            {bonusItems.map((b, j) => (
              <li
                key={j}
                className={cn(
                  "flex gap-2.5 text-lg leading-8 text-slate-700 [text-align:start] [text-wrap:pretty]",
                )}
              >
                <span className="text-sky-700" aria-hidden>
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function StudyPlanCards({
  title,
  options,
}: {
  title: string;
  options: { label: string; detail: string }[];
}) {
  if (!options.length) return null;
  return (
    <div className="[direction:rtl] [text-align:start]">
      <h3 className={cn(amirantPremiumTypo.sectionTitle, "mb-3")}>{title}</h3>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {options.map((o, i) => (
          <div key={i} className={cn(amirantPremiumCard, "p-4 sm:p-5")}>
            <p className="text-sm font-semibold text-[#0f2347] [text-align:start]">{o.label}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 [text-align:start] [text-wrap:pretty]">{o.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExamScoreBulletCards({ title, bullets }: { title: string; bullets: string[] }) {
  if (!bullets.length) return null;
  return (
    <div className="space-y-3 [direction:rtl] [text-align:start]">
      <h3 className={amirantPremiumTypo.sectionTitle}>{title}</h3>
      <ul className="space-y-2" role="list">
        {bullets.map((b, i) => (
          <li
            key={i}
            className={cn(
              "rounded-2xl border border-stone-200/70 bg-stone-50/40 px-4 py-3 text-lg leading-7 text-slate-800 [text-align:start] [text-wrap:pretty] sm:px-5",
            )}
          >
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
