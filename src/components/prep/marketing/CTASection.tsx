import { ButtonLink } from "@/components/ui";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { MARKETING_CTA } from "@/lib/prep/marketing/content";

export function CTASection() {
  const cta = MARKETING_CTA;
  return (
    <MarketingSection id="pricing-cta" title={cta.title} subtitle={cta.subtitle} tone="navy">
      <div className="flex flex-wrap items-center gap-4">
        <ButtonLink
          href={cta.primary.href}
          variant="primary"
          className="border-0 bg-paper text-primary hover:bg-slate-100"
        >
          {cta.primary.label}
        </ButtonLink>
        <ButtonLink
          href={cta.secondary.href}
          variant="secondary"
          className="border-white/25 bg-transparent text-paper hover:bg-white/10"
        >
          {cta.secondary.label}
        </ButtonLink>
      </div>
    </MarketingSection>
  );
}
