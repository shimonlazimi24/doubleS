import type { RoadmapStepPayload, RoadmapTableRow, RoadmapWeekParsed } from "@/lib/amirant-course/lesson-content/roadmap-premium-parse";
import { amirantPremiumTypo } from "../lesson/amirant-premium-typography";
import { cn } from "@/lib/design-system/cn";
import { RoadmapMilestoneChecklist } from "./roadmap-milestone-checklist";

type Mode = "structure" | "plan6";

type Props = {
  mode: Mode;
  payload: RoadmapStepPayload;
};

const weekCard =
  "rounded-2xl border border-stone-200/80 bg-white p-5 [direction:rtl] [text-align:start] sm:p-6";

function RoadmapWeekCard({ w }: { w: RoadmapWeekParsed }) {
  return (
    <div className={cn(weekCard, "space-y-3")}>
      <div className="border-b border-stone-100/90 pb-2.5">
        <h3 className={cn(amirantPremiumTypo.sectionTitle, "text-pretty [text-wrap:balance]")}>{w.title}</h3>
      </div>
      {w.tableRows && w.tableRows.length > 0 ? (
        <ul className="space-y-0" role="list" aria-label="משימות לפי ימים">
          {w.tableRows.map((r, i) => (
            <RoadmapTableTaskRow key={i} r={r} isLast={i === w.tableRows!.length - 1} />
          ))}
        </ul>
      ) : w.bodyParagraphs && w.bodyParagraphs.length > 0 ? (
        <ul className="space-y-1.5" role="list">
          {w.bodyParagraphs.map((line, i) => (
            <li key={i} className="flex gap-2.5 [text-align:start]">
              <span className="text-sky-700/80" aria-hidden>
                ·
              </span>
              <span className="text-lg leading-8 text-slate-800 [text-wrap:pretty]">{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {w.weekTotalLine ? (
        <p className="pt-1 text-sm font-medium text-slate-600 [text-align:start] sm:text-base">{w.weekTotalLine}</p>
      ) : null}
    </div>
  );
}

function RoadmapTableTaskRow({ r, isLast }: { r: RoadmapTableRow; isLast: boolean }) {
  return (
    <li
      className={cn(
        "flex flex-col gap-1 border-b border-stone-100/80 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-3",
        isLast && "pb-0",
      )}
    >
      <span className="w-8 shrink-0 text-xs font-medium text-slate-500 sm:w-9">{r.day}</span>
      <span className="min-w-0 flex-1 text-lg leading-7 text-slate-800 [text-wrap:pretty] sm:leading-8">{r.task}</span>
      <span className="shrink-0 text-sm text-slate-500 [text-align:end] sm:text-sm">{r.time}</span>
    </li>
  );
}

function RoadmapTrackingCards({ payload }: { payload: RoadmapStepPayload["tracking"] }) {
  if (!payload?.rows?.length) return null;
  const headers = payload.headers ?? [];
  return (
    <div className="space-y-3 [direction:rtl] [text-align:start]">
      <h3 className={amirantPremiumTypo.sectionTitle}>מעקב אישי</h3>
      <ul className="space-y-2" role="list" aria-label="מעקב אישי">
        {payload.rows.map((row, ri) => (
          <li
            key={ri}
            className="rounded-2xl border border-stone-200/80 bg-stone-50/30 p-3.5 sm:p-4"
            role="listitem"
          >
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(7rem,1fr))]">
              {row.map((cell, ci) => {
                const label = headers[ci] ?? `עמודה ${ci + 1}`;
                return (
                  <div key={ci} className="min-w-0 [text-align:start]">
                    <p className="text-xs font-medium uppercase tracking-wide text-sky-800/85 [text-align:start]">{label}</p>
                    <p className="mt-0.5 text-base leading-7 text-slate-800 [text-wrap:pretty] sm:text-lg sm:leading-8">{cell}</p>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * “איך בנויה מפת הדרכים” = intro + יעדים + מעקב. “תוכנית 6 שבועות” = כרטיסי שבוע.
 */
export function RoadmapWorkspaceBody({ mode, payload }: Props) {
  if (mode === "structure") {
    return (
      <div className="space-y-6 [direction:rtl]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          {payload.introShort?.trim() ? (
            <div className="min-w-0 rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4 [text-align:start] sm:p-5">
              <p className="whitespace-pre-line text-pretty text-lg font-normal leading-8 text-slate-800 [text-wrap:pretty] sm:text-lg">
                {payload.introShort}
              </p>
            </div>
          ) : null}
          {payload.milestoneGroups.length ? (
            <div className="min-w-0">
              <RoadmapMilestoneChecklist groups={payload.milestoneGroups} />
            </div>
          ) : null}
        </div>
        <RoadmapTrackingCards payload={payload.tracking} />
      </div>
    );
  }

  return (
    <div className="space-y-3 [direction:rtl] [text-align:start]">
      <div className="space-y-3">
        {payload.weeks.map((w) => (
          <RoadmapWeekCard key={w.weekIndex} w={w} />
        ))}
      </div>
      {payload.programTotalLine ? (
        <p className="rounded-2xl border border-sky-100/80 bg-sky-50/40 px-4 py-3 text-sm font-medium text-slate-800 [text-align:start] sm:text-base">
          {payload.programTotalLine}
        </p>
      ) : null}
    </div>
  );
}
