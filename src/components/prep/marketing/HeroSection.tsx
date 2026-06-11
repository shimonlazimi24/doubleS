import { ButtonLink, Container } from "@/components/ui";
import { ProductDashboardPreview } from "@/components/prep/marketing/ProductDashboardPreview";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { cn } from "@/lib/design-system/cn";

export function HeroSection() {
  const hero = MARKETING_HERO;
  return (
    <section className="relative overflow-hidden border-b border-line/50 bg-paper">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_80%_-20%,rgba(14,165,233,0.12),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_100%,rgba(15,35,71,0.05),transparent_55%)]"
        aria-hidden
      />

      <Container className={cn("relative py-12 md:py-16 lg:py-[4.5rem]")}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-14">
          <div className="max-w-xl lg:max-w-lg order-2 lg:order-1">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Academic English Prep
            </p>
            <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink md:text-[2.5rem] lg:text-[2.75rem]">
              {hero.headline}
            </h1>
            <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-muted md:text-[1.0625rem]">
              {hero.subheadline}
            </p>

            <TrustIndicators items={hero.trust} className="mt-7" />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={hero.ctaPrimary.href}
                variant="primary"
                className="min-h-11 px-6 text-sm font-semibold shadow-cta"
              >
                {hero.ctaPrimary.label}
              </ButtonLink>
              <ButtonLink
                href={hero.ctaSecondary.href}
                variant="secondary"
                className="min-h-11 border-line/80 px-6 text-sm font-medium"
              >
                {hero.ctaSecondary.label}
              </ButtonLink>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-muted-2">
              מיועד לבוגרים לפני תואר · מבוא חינמי · גישה מלאה אחרי הרשמה
            </p>
          </div>

          <div className="order-1 lg:order-2"><ProductDashboardPreview /></div>
        </div>
      </Container>
    </section>
  );
}
