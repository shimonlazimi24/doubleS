import { ButtonLink, Container } from "@/components/ui";
import { MARKETING_CTA } from "@/lib/prep/marketing/content";
import { Reveal } from "./motion/Reveal";

/** The closing call, centred and large: the free entry point first, the prices second. */
export function CTASection() {
  const cta = MARKETING_CTA;
  return (
    <section id="pricing-cta" className="bg-paper py-24 md:py-32">
      <Container max="shell">
        <Reveal className="mx-auto max-w-[46rem] text-center">
          <h2 className="text-[2.2rem] font-black leading-[1.12] tracking-tight text-ink md:text-[2.9rem]">{cta.title}</h2>
          <p className="mx-auto mt-4 max-w-[38rem] text-lg leading-relaxed text-muted md:text-xl">{cta.subtitle}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={cta.primary.href} variant="primary" className="min-h-[3.25rem] !rounded px-7 text-[16px] font-extrabold">
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink href={cta.secondary.href} variant="secondary" className="min-h-[3.25rem] !rounded !border-primary px-7 text-[16px] !text-primary">
              {cta.secondary.label}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
