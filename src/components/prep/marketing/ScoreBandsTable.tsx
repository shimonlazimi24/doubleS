import { EXAM_SCORE_BANDS, EXAM_SCORE_SCALE } from "@/lib/amirant-course/exam-facts";

/** The official placement levels as a table of facts; no colours, no bars. */
export function ScoreBandsTable() {
  const bands = [...EXAM_SCORE_BANDS].reverse();
  return (
    <div className="max-w-3xl">
      <table className="w-full border-collapse text-start">
        <thead>
          <tr className="text-xs font-bold text-muted">
            <th className="w-24 pb-2 text-start">ציון</th>
            <th className="w-32 pb-2 text-start">רמה</th>
            <th className="pb-2 text-start">משמעות ברוב המוסדות</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b.min} className="border-t border-line/70">
              <td className="py-3 text-[15px] font-bold tabular-nums text-ink">
                {b.min}–{b.max}
              </td>
              <td className="py-3 text-[15px] font-semibold text-ink">{b.levelHe}</td>
              <td className="py-3 text-sm leading-relaxed text-muted">{b.meaningHe}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line/70 pt-3 text-xs text-muted">
        סולם הציונים {EXAM_SCORE_SCALE.min}–{EXAM_SCORE_SCALE.max}. הדרישות המדויקות משתנות בין מוסדות ובין חוגים; הציון הרשמי נקבע במבחן של
        מאל״ו בלבד.
      </p>
    </div>
  );
}
