import { ButtonLink } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { MARKETING_PLANS } from "@/lib/prep/marketing/course-facts";
import { SectionPanel } from "./SectionPanel";
import { cn } from "@/lib/design-system/cn";

/**
 * The three plans side by side, prices from the same source the checkout uses.
 * The plan with the lowest price per day is marked, because that is a fact.
 */
export function PlansTable() {
  const cheapestPerDay = Math.min(...MARKETING_PLANS.map((p) => p.perDay));
  return (
    <div>
      <ul className="grid gap-6 md:grid-cols-3">
        {MARKETING_PLANS.map((p) => {
          const best = p.perDay === cheapestPerDay;
          return (
            <li key={p.id}>
              <SectionPanel className={cn("flex h-full flex-col p-6 text-right", best && "border-primary ring-1 ring-primary")}>
                <p className="text-sm font-semibold text-muted">{p.days} ימים</p>
                <h3 className="mt-1 text-xl font-bold text-ink">{p.label}</h3>
                <p className="mt-5 text-4xl font-extrabold tabular-nums tracking-tight text-primary">
                  {p.priceNis} <span className="text-xl font-bold">₪</span>
                </p>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  כ־{p.perDay} ₪ ליום{best ? " · המחיר הנמוך ביותר ליום" : ""}
                </p>
                <ButtonLink
                  href={`${PREP_BASE}/pricing`}
                  variant={best ? "primary" : "secondary"}
                  className="mt-6 min-h-11 w-full !rounded text-[15px] font-bold"
                >
                  לרכישת גישה
                </ButtonLink>
              </SectionPanel>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted">
        כל תוכנית פותחת את הקורס כולו: כל המודולים, יחידות התרגול לפי רמה, הסימולציות והעוזר. מודול המבוא ומבחן הרמה פתוחים בלי תשלום.
        בלי מנוי מתחדש; אפשר להאריך בסוף התקופה.
      </p>
    </div>
  );
}
