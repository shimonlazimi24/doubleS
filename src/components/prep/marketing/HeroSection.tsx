import { ButtonLink, Container } from "@/components/ui";
import { ProductDashboardPreview } from "@/components/prep/marketing/ProductDashboardPreview";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { cn } from "@/lib/design-system/cn";

export function HeroSection() {
  const hero = MARKETING_HERO;
  return (
    // "אקדמי מחודד": נייר נקי בלי washes — קווי שיער עושים את העבודה
    <section className="relative border-b border-line bg-paper">
      <Container className={cn("relative py-12 md:py-16 lg:py-[4.5rem]")}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-14">
          <div className="max-w-xl lg:max-w-lg order-2 lg:order-1 text-right">
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

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
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
