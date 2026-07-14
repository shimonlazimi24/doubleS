import { ButtonLink, Container } from "@/components/ui";
import { MARKETING_CTA } from "@/lib/prep/marketing/content";

/** CTA סוגר בשפה הבהירה של המערכת - עקבי עם עמוד האמירנט (בלי בלוק נייבי מלא). */
export function CTASection() {
  const cta = MARKETING_CTA;
  return (
    <section id="pricing-cta" className="border-t border-line bg-paper py-12 md:py-16">
      <Container max="shell">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-primary md:text-3xl">
            {cta.title}
          </h2>
          <p className="text-base leading-relaxed text-muted">{cta.subtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <ButtonLink href={cta.primary.href} variant="primary" className="shadow-cta">
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink href={cta.secondary.href} variant="secondary">
              {cta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
