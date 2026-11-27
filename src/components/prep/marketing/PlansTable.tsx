import { ButtonLink } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { MARKETING_PLANS } from "@/lib/prep/marketing/course-facts";
import { Reveal } from "./motion/Reveal";

/**
 * The three plans as three even columns between hairlines, prices from the
 * same source the checkout uses. No plan is singled out: we have no data on
 * which one people pick, so none gets a "featured" box.
 */
export function PlansTable() {
  const cheapestPerDay = Math.min(...MARKETING_PLANS.map((p) => p.perDay));
  return (
    <div>
      <ul className="grid border-y border-line md:grid-cols-3 md:divide-x md:divide-x-reverse md:divide-line">
        {MARKETING_PLANS.map((p) => (
          <li
            key={p.id}
            className="flex flex-col border-b border-line py-8 text-right last:border-b-0 md:border-b-0 md:px-8 md:first:ps-0 md:last:pe-0"
          >
            <p className="text-[16px] text-muted">{p.days} ימים</p>
            <h3 className="mt-1 text-[1.6rem] font-extrabold">{p.label}</h3>
            <p className="mt-7 text-[3.5rem] font-black leading-none tabular-nums text-primary">
              {p.priceNis} <span className="text-2xl font-bold">₪</span>
            </p>
            <p className="mt-2 text-[15px] tabular-nums text-muted">
              כ־{p.perDay} ₪ ליום{p.perDay === cheapestPerDay ? " · הנמוך ביותר ליום" : ""}
            </p>
            <ButtonLink href={`${PREP_BASE}/pricing`} variant="secondary" className="mt-7 min-h-12 w-full !rounded !border-primary text-[15px] font-bold !text-primary">
              לרכישת גישה
            </ButtonLink>
          </li>
        ))}
      </ul>
      <Reveal>
        <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-muted">
          כל תוכנית פותחת את הקורס כולו: כל המודולים, יחידות התרגול לפי רמה, הסימולציות, ההאזנה, הכתיבה והעוזר. מודול המבוא ומבחן
          הרמה פתוחים בלי תשלום. בלי מנוי מתחדש; אפשר להאריך בסוף התקופה.
        </p>
      </Reveal>
    </div>
  );
}
