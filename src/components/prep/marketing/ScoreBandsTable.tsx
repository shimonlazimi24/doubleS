import { EXAM_SCORE_BANDS, EXAM_SCORE_SCALE } from "@/lib/amirant-course/exam-facts";
import { cn } from "@/lib/design-system/cn";
import { Reveal } from "./motion/Reveal";

const SHADES = ["bg-[#eef1f7]", "bg-[#e2e7f0]", "bg-[#cfd8e8]", "bg-[#a9b8d3]"];

/**
 * The official placement levels as one scale from 50 to 150, each band sized
 * by its width and the exemption band in navy; the meaning of each band as
 * plain lines beside it. The scale grows in when it scrolls into view.
 */
export function ScoreBandsTable() {
  const span = EXAM_SCORE_SCALE.max - EXAM_SCORE_SCALE.min + 1;
  const bands = [...EXAM_SCORE_BANDS];
  const top = bands[bands.length - 1];
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal from="start">
        <h2 className="text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.6rem]">כמה כל ציון שווה</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl">
          רמות המיון הרשמיות של האוניברסיטאות. כל מדרגה למעלה היא פחות קורסי אנגלית בתואר, פחות סמסטרים ופחות כסף. מי שמגיע ל-{top.min}{" "}
          פטור לגמרי.
        </p>
      </Reveal>
      <Reveal from="end" delay={120}>
        <div className="scale-grow flex h-16 w-full overflow-hidden rounded" dir="ltr">
          {bands.map((b, i) => {
            const pct = ((b.max - b.min + 1) / span) * 100;
            const exempt = b === top;
            return (
              <div
                key={b.min}
                style={{ width: `${pct}%` }}
                className={cn("flex min-w-0 flex-col justify-center px-2.5", exempt ? "bg-primary text-white" : SHADES[i] ?? SHADES[0])}
                dir="rtl"
              >
                <p className={cn("truncate text-[13px] font-bold", exempt ? "text-white" : "text-ink")}>{b.levelHe}</p>
                <p className={cn("text-xs tabular-nums", exempt ? "text-white/80" : "text-muted")}>
                  {b.min}–{b.max}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[13px] tabular-nums text-muted" dir="ltr">
          <span>{EXAM_SCORE_SCALE.min}</span>
          <span>{EXAM_SCORE_SCALE.max}</span>
        </div>
        <ul className="mt-7 space-y-1.5 text-[16px] leading-relaxed text-ink">
          {[...bands].reverse().map((b) => (
            <li key={b.min}>
              <span className="font-bold">{b.levelHe}</span>
              <span className="text-muted"> · {b.meaningHe}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted">הדרישות המדויקות משתנות בין מוסדות ובין חוגים; הציון הרשמי נקבע במבחן של מאל״ו בלבד.</p>
      </Reveal>
    </div>
  );
}
