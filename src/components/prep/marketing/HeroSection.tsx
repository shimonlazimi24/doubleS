import { ButtonLink, Container } from "@/components/ui";
import { CoursePreviewCard } from "@/components/prep/marketing/CoursePreviewCard";
import { TrustChips } from "@/components/prep/marketing/TrustChips";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { cn } from "@/lib/design-system/cn";

export function HeroSection() {
  const hero = MARKETING_HERO;
  return (
    <section className="relative overflow-hidden bg-canvas">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,165,233,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -start-24 top-1/4 h-72 w-72 rounded-full bg-primary/[0.04] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-16 bottom-0 h-64 w-64 rounded-full bg-accent/[0.08] blur-3xl"
        aria-hidden
      />

      <Container className={cn("relative py-16 md:py-24 lg:py-28")}>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              הכנה אקדמית לבוגרים
            </p>
            <h1 className="text-3xl font-semibold leading-[1.12] tracking-tight text-ink md:text-4xl lg:text-[2.75rem]">
              {hero.headline}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{hero.subheadline}</p>

            <TrustChips items={hero.chips} className="mt-8" />

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href={hero.ctaPrimary.href} variant="primary" className="px-5 py-3 text-base">
                {hero.ctaPrimary.label}
              </ButtonLink>
              <ButtonLink href={hero.ctaSecondary.href} variant="secondary" className="px-5 py-3 text-base">
                {hero.ctaSecondary.label}
              </ButtonLink>
            </div>
          </div>

          <div className="relative lg:justify-self-end">
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl border border-line/40 bg-paper/40"
              aria-hidden
            />
            <CoursePreviewCard />
          </div>
        </div>
      </Container>
    </section>
  );
}
