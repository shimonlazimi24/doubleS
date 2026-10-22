import { ButtonLink, Container } from "@/components/ui";
import { MARKETING_CTA } from "@/lib/prep/marketing/content";

/** The closing call: the free entry point first, the prices second. */
export function CTASection() {
  const cta = MARKETING_CTA;
  return (
    <section id="pricing-cta" className="border-t border-line bg-canvas py-12 md:py-16">
      <Container max="shell">
        <div className="max-w-2xl text-right">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-[1.75rem]">{cta.title}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted">{cta.subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href={cta.primary.href} variant="primary" className="min-h-11 !rounded px-6 text-[15px] font-bold">
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink href={cta.secondary.href} variant="secondary" className="min-h-11 !rounded px-6 text-[15px]">
              {cta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
