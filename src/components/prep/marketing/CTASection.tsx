import { ButtonLink, Container } from "@/components/ui";
import { MARKETING_CTA } from "@/lib/prep/marketing/content";

/** The closing call on a navy band: the free entry point first, the prices second. */
export function CTASection() {
  const cta = MARKETING_CTA;
  return (
    <section id="pricing-cta" className="bg-primary py-16 text-white md:py-24">
      <Container max="shell">
        <div className="max-w-2xl text-right">
          <h2 className="text-[1.9rem] font-extrabold leading-[1.15] tracking-tight md:text-[2.4rem]">{cta.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-white/80">{cta.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={cta.primary.href}
              variant="primary"
              className="min-h-12 !rounded !bg-white px-7 text-[15px] font-bold !text-primary hover:!bg-white/90"
            >
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink
              href={cta.secondary.href}
              variant="secondary"
              className="min-h-12 !rounded !border-white/50 !bg-transparent px-7 text-[15px] !text-white hover:!bg-white/10"
            >
              {cta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
