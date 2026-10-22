import { ButtonLink } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { MARKETING_PLANS } from "@/lib/prep/marketing/course-facts";

/** The three plans as one flat table, prices from the same source the checkout uses. */
export function PlansTable() {
  return (
    <div className="max-w-3xl">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-xs font-bold text-muted">
            <th className="pb-2 text-start">תוכנית</th>
            <th className="w-24 pb-2 text-start">משך</th>
            <th className="w-24 pb-2 text-start">מחיר</th>
            <th className="w-28 pb-2 text-start">ליום</th>
          </tr>
        </thead>
        <tbody>
          {MARKETING_PLANS.map((p) => (
            <tr key={p.id} className="border-t border-line/70">
              <td className="py-3 text-[15px] font-bold text-ink">{p.label}</td>
              <td className="py-3 text-sm tabular-nums text-muted">{p.days} ימים</td>
              <td className="py-3 text-[15px] font-bold tabular-nums text-ink">{p.priceNis} ₪</td>
              <td className="py-3 text-sm tabular-nums text-muted">כ־{p.perDay} ₪</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line/70 pt-3 text-sm leading-relaxed text-muted">
        כל תוכנית פותחת את הקורס כולו: כל המודולים, יחידות התרגול לפי רמה, הסימולציות והעוזר. מודול המבוא ומבחן הרמה פתוחים
        בלי תשלום. אפשר להאריך בסוף התקופה.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <ButtonLink href={`${PREP_BASE}/pricing`} variant="primary" className="!rounded">
          לרכישת גישה
        </ButtonLink>
        <ButtonLink href={`${PREP_BASE}/amirant/course/quiz/quiz-entry-diagnostic`} variant="secondary" className="!rounded">
          קודם מבחן רמה חינם
        </ButtonLink>
      </div>
    </div>
  );
}
