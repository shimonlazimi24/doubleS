import { ButtonLink } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { MARKETING_PLANS } from "@/lib/prep/marketing/course-facts";
import { cn } from "@/lib/design-system/cn";
import { Reveal } from "./motion/Reveal";

/**
 * The three plans as three columns separated by air, prices from the same
 * source the checkout uses. The middle plan sits on navy: the one box on the
 * page, and the only emphasis.
 */
export function PlansTable() {
  const cheapestPerDay = Math.min(...MARKETING_PLANS.map((p) => p.perDay));
  const featured = MARKETING_PLANS[1]?.id;
  return (
    <div>
      <ul className="grid gap-6 md:grid-cols-3 md:gap-0">
        {MARKETING_PLANS.map((p, i) => {
          const dark = p.id === featured;
          return (
            <Reveal
              as="li"
              key={p.id}
              delay={i * 110}
              className={cn(
                "flex flex-col text-right",
                dark ? "rounded-md bg-primary p-10 text-white" : "p-10 md:px-10 md:first:ps-0 md:last:pe-0",
              )}
            >
              <p className={cn("text-[16px]", dark ? "text-white/70" : "text-muted")}>{p.days} ימים</p>
              <h3 className="mt-1 text-[1.6rem] font-extrabold">{p.label}</h3>
              <p className={cn("mt-7 text-[3.5rem] font-black leading-none tabular-nums", dark ? "text-white" : "text-primary")}>
                {p.priceNis} <span className="text-2xl font-bold">₪</span>
              </p>
              <p className={cn("mt-2 text-[15px] tabular-nums", dark ? "text-white/75" : "text-muted")}>
                כ־{p.perDay} ₪ ליום{p.perDay === cheapestPerDay ? " · הנמוך ביותר ליום" : ""}
              </p>
              <ButtonLink
                href={`${PREP_BASE}/pricing`}
                variant={dark ? "primary" : "secondary"}
                className={cn(
                  "mt-7 min-h-12 w-full !rounded text-[15px] font-bold",
                  dark ? "!bg-white !text-primary hover:!bg-white/90" : "!border-primary !text-primary",
                )}
              >
                לרכישת גישה
              </ButtonLink>
            </Reveal>
          );
        })}
      </ul>
      <Reveal delay={360}>
        <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-muted">
          כל תוכנית פותחת את הקורס כולו: כל המודולים, יחידות התרגול לפי רמה, הסימולציות, ההאזנה, הכתיבה והעוזר. מודול המבוא ומבחן
          הרמה פתוחים בלי תשלום. בלי מנוי מתחדש; אפשר להאריך בסוף התקופה.
        </p>
      </Reveal>
    </div>
  );
}
