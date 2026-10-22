import { ButtonLink, Container } from "@/components/ui";
import { HeroVideoBackground } from "@/components/prep/marketing/HeroVideoBackground";
import { TrustIndicators, type TrustItem } from "@/components/prep/marketing/TrustIndicators";
import { Reveal } from "@/components/prep/marketing/motion/Reveal";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

const HERO_VIDEO = "/prep/hero-bg.mp4";
const HERO_POSTER = "/prep/hero-poster.jpg";

/** The four figures under the hero, from the course manifest and bank. */
export function courseTrustItems(): TrustItem[] {
  return [
    { value: COURSE_FACTS.lessons, label: "שיעורים" },
    { value: COURSE_FACTS.questions, label: "שאלות עם הסבר מלא" },
    { value: COURSE_FACTS.simulations, label: "סימולציות מלאות בתנאי זמן" },
    { value: COURSE_FACTS.practiceUnits, label: "יחידות תרגול לפי רמה" },
  ];
}

type HeroCopy = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  note: string;
};

/**
 * Full-bleed footage of the real course under a navy shade; the eyebrow,
 * headline, lead and actions enter in four beats. Below it, the figures.
 */
export function MarketingHero({ copy }: { copy: HeroCopy }) {
  return (
    <>
      <section className="relative flex min-h-[calc(100svh-6.5rem)] items-center text-white lg:min-h-[calc(100svh-4rem)]">
        <HeroVideoBackground src={HERO_VIDEO} poster={HERO_POSTER} />
        <Container className="relative py-20 md:py-28">
          <div className="max-w-[44rem] text-right">
            <Reveal delay={0}>
              <p className="mb-4 text-sm font-semibold text-white/80">{copy.eyebrow}</p>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="text-[2.5rem] font-black leading-[1.08] tracking-tight md:text-[3.8rem]">{copy.headline}</h1>
            </Reveal>
            <Reveal delay={260}>
              <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-white/85 md:text-[1.3rem]">{copy.subheadline}</p>
            </Reveal>
            <Reveal delay={400}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href={copy.primary.href}
                  variant="primary"
                  className="min-h-[3.25rem] !rounded !bg-white px-7 text-[16px] font-extrabold !text-primary hover:!bg-white/90"
                >
                  {copy.primary.label}
                </ButtonLink>
                <ButtonLink
                  href={copy.secondary.href}
                  variant="secondary"
                  className="min-h-[3.25rem] !rounded !border-white/55 !bg-transparent px-7 text-[16px] !text-white hover:!bg-white/10"
                >
                  {copy.secondary.label}
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/75">{copy.note}</p>
            </Reveal>
          </div>
        </Container>
      </section>
      <section className="bg-paper">
        <Container className="py-12 md:py-14">
          <TrustIndicators items={courseTrustItems()} />
        </Container>
      </section>
    </>
  );
}

export function HeroSection() {
  const hero = MARKETING_HERO;
  return (
    <MarketingHero
      copy={{
        eyebrow: "קורס הכנה דיגיטלי לאמירנט",
        headline: hero.headline,
        subheadline: hero.subheadline,
        primary: hero.ctaPrimary,
        secondary: hero.ctaSecondary,
        note: "מבוא ומבחן רמה בלי תשלום ובלי כרטיס אשראי. הקורס המלא משבוע עד חודש.",
      }}
    />
  );
}
