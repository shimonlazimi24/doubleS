import { ButtonLink, Container } from "@/components/ui";
import { ProductShot } from "@/components/prep/marketing/ProductShot";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

/**
 * The opening of the site: what the course is, in one sentence, the real
 * product beside it, and figures taken from the course itself.
 */
export function HeroSection() {
  const hero = MARKETING_HERO;
  const trust = [
    { value: String(COURSE_FACTS.lessons), label: "שיעורים" },
    { value: String(COURSE_FACTS.practiceUnits), label: "יחידות תרגול לפי רמה" },
    { value: String(COURSE_FACTS.simulations), label: "סימולציות מלאות" },
    { value: String(COURSE_FACTS.questions), label: "שאלות עם הסבר" },
  ];
  return (
    <section className="border-b border-line bg-paper">
      <Container className="py-12 md:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
          <div className="text-right">
            <p className="mb-3 text-sm font-semibold text-muted">קורס הכנה דיגיטלי לאמירנט</p>
            <h1 className="text-[2rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.5rem]">{hero.headline}</h1>
            <p className="mt-4 max-w-[34rem] text-[17px] leading-relaxed text-muted">{hero.subheadline}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href={hero.ctaPrimary.href} variant="primary" className="min-h-11 !rounded px-6 text-[15px] font-bold">
                {hero.ctaPrimary.label}
              </ButtonLink>
              <ButtonLink href={hero.ctaSecondary.href} variant="secondary" className="min-h-11 !rounded px-6 text-[15px]">
                {hero.ctaSecondary.label}
              </ButtonLink>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">מבוא ומבחן רמה בלי תשלום ובלי כרטיס אשראי. הקורס המלא משבוע עד חודש.</p>

            <TrustIndicators items={trust} className="mt-8" />
          </div>

          <ProductShot priority />
        </div>
      </Container>
    </section>
  );
}
