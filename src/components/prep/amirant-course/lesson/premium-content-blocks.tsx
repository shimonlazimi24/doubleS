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

/** Inline `**bold**` renderer for table-cell copy - never leaks raw asterisks. */
function InlineMdBold({ text }: { text: string }) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-slate-900">
            {p}
          </strong>
        ) : (
          <span key={i}>{p.replace(/\*\*/g, "")}</span>
        ),
      )}
    </>
  );
}

/** צבע + רוחב פס לפי מיקום הטווח בסקאלה 50-150 (רמה עולה = פס ארוך וירוק יותר). */
function scoreLaneVisual(range: string): { widthPct: number; tone: string } {
  const nums = range.match(/\d+/g)?.map(Number) ?? [];
  const hi = nums.length ? Math.max(...nums) : NaN;
  const widthPct = Number.isNaN(hi) ? 50 : Math.min(95, Math.max(14, ((hi - 50) / 100) * 95));
  const tone =
    Number.isNaN(hi) || hi < 85
      ? "bg-rose-700"
      : hi < 100
        ? "bg-amber-600"
        : hi < 120
          ? "bg-sky-600"
          : hi < 134
            ? "bg-sky-800"
            : "bg-emerald-700";
  return { widthPct, tone };
}

/** סולם ציונים קומפקטי: קונטיינר אחד, שורה לכל טווח + פס רמה - לא ערימת כרטיסיות. */
export function ScoreRangeCards({ rows }: { rows: ScoreRow[] }) {
  if (!rows.length) return null;
  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white [direction:rtl]"
      role="list"
      aria-label="סולם ציונים"
    >
      {rows.map((r, i) => {
        const range = r.range.replace(/\*\*/g, "").replace(/(\d)\s*-\s*(\d)/, "$1–$2");
        const { widthPct, tone } = scoreLaneVisual(range);
        return (
          <div
            key={i}
            role="listitem"
            className={cn("px-4 py-3 sm:px-5", i > 0 && "border-t border-stone-100")}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:flex-nowrap">
              <span className="w-[4.5rem] shrink-0 text-sm font-bold tabular-nums text-[#0f2347] [direction:ltr] [text-align:end] sm:w-[5.5rem]">
                {range}
              </span>
              <p className="min-w-0 flex-1 text-base leading-7 text-slate-800 [text-align:start] [text-wrap:pretty]">
                <InlineMdBold text={r.meaning} />
                {r.detail ? (
                  <span className="text-slate-500">
                    {" "}
                    · <InlineMdBold text={r.detail} />
                  </span>
                ) : null}
              </p>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-stone-100" aria-hidden>
              <div className={cn("h-full rounded-full", tone)} style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        );
      })}
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
