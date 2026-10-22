import { ButtonLink, Container } from "@/components/ui";
import { HeroVideoBackground } from "@/components/prep/marketing/HeroVideoBackground";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

const HERO_VIDEO = "/prep/hero-bg.mp4";
const HERO_POSTER = "/prep/hero-poster.jpg";

/**
 * The opening of the site: full-bleed footage of the real course under a navy
 * shade, the promise in one sentence, two actions. The figures below come
 * from the course itself.
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
    <>
      <section className="relative flex min-h-[calc(100svh-6.5rem)] items-center text-white lg:min-h-[calc(100svh-4rem)]">
        <HeroVideoBackground src={HERO_VIDEO} poster={HERO_POSTER} />
        <Container className="relative py-20 md:py-28">
          <div className="max-w-[40rem] text-right">
            <p className="mb-4 text-sm font-semibold text-white/80">קורס הכנה דיגיטלי לאמירנט</p>
            <h1 className="text-[2.4rem] font-extrabold leading-[1.1] tracking-tight md:text-[3.4rem]">{hero.headline}</h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-white/85 md:text-xl">{hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={hero.ctaPrimary.href}
                variant="primary"
                className="min-h-12 !rounded !bg-white px-7 text-[15px] font-bold !text-primary hover:!bg-white/90"
              >
                {hero.ctaPrimary.label}
              </ButtonLink>
              <ButtonLink
                href={hero.ctaSecondary.href}
                variant="secondary"
                className="min-h-12 !rounded !border-white/50 !bg-transparent px-7 text-[15px] !text-white hover:!bg-white/10"
              >
                {hero.ctaSecondary.label}
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">מבוא ומבחן רמה בלי תשלום ובלי כרטיס אשראי. הקורס המלא משבוע עד חודש.</p>
          </div>
        </Container>
      </section>
      <section className="border-b border-line bg-paper">
        <Container className="py-6 md:py-8">
          <TrustIndicators items={trust} />
        </Container>
      </section>
    </>
  );
}
