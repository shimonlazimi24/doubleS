import { EXAM_SCORE_BANDS, EXAM_SCORE_SCALE } from "@/lib/amirant-course/exam-facts";
import { SectionPanel } from "./SectionPanel";
import { cn } from "@/lib/design-system/cn";

/**
 * The official placement levels as a scale: one bar across the 50–150 range,
 * each band sized by its width, the exemption band in navy; the meaning of
 * each band in the table under it.
 */
export function ScoreBandsTable() {
  const span = EXAM_SCORE_SCALE.max - EXAM_SCORE_SCALE.min + 1;
  const bands = [...EXAM_SCORE_BANDS];
  const top = bands[bands.length - 1];
  return (
    <SectionPanel className="max-w-4xl p-6 md:p-8">
      <div className="flex w-full overflow-hidden rounded border border-line" dir="ltr">
        {bands.map((b, i) => {
          const pct = ((b.max - b.min + 1) / span) * 100;
          const exempt = b === top;
          return (
            <div
              key={b.min}
              style={{ width: `${pct}%` }}
              className={cn(
                "flex min-w-0 flex-col justify-end px-2 py-2.5 text-center",
                exempt ? "bg-primary text-white" : i % 2 ? "bg-surface-low" : "bg-paper",
                i > 0 && "border-l border-line",
              )}
              dir="rtl"
            >
              <p className={cn("truncate text-[13px] font-bold", exempt ? "text-white" : "text-ink")}>{b.levelHe}</p>
              <p className={cn("mt-0.5 text-xs tabular-nums", exempt ? "text-white/80" : "text-muted")}>
                {b.min}–{b.max}
              </p>
            </div>
          );
        })}
      </div>
      <ul className="mt-6 divide-y divide-line/70">
        {[...bands].reverse().map((b) => (
          <li key={b.min} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[7rem_8rem_1fr]">
            <span className="text-[15px] font-bold tabular-nums text-ink">
              {b.min}–{b.max}
              <span className="ms-3 font-semibold sm:hidden">{b.levelHe}</span>
            </span>
            <span className="hidden text-[15px] font-semibold text-ink sm:block">{b.levelHe}</span>
            <span className="text-[15px] leading-relaxed text-muted">{b.meaningHe}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        סולם הציונים {EXAM_SCORE_SCALE.min}–{EXAM_SCORE_SCALE.max}. הדרישות המדויקות משתנות בין מוסדות ובין חוגים; הציון הרשמי נקבע במבחן של
        מאל״ו בלבד.
      </p>
    </SectionPanel>
  );
}
