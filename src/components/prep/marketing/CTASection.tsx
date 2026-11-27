import Link from "next/link";
import { ButtonLink, Container } from "@/components/ui";
import { MARKETING_CTA } from "@/lib/prep/marketing/content";
import { Reveal } from "./motion/Reveal";

/** The closing call: the free placement test, right-aligned like every other section; prices as a quiet link. */
export function CTASection() {
  const cta = MARKETING_CTA;
  return (
    <section id="pricing-cta" className="bg-paper py-24 md:py-32">
      <Container max="shell">
        <Reveal className="max-w-[46rem] text-right">
          <h2 className="text-[2.2rem] font-black leading-[1.12] tracking-tight text-ink md:text-[2.9rem]">{cta.title}</h2>
          <p className="mt-4 max-w-[38rem] text-lg leading-relaxed text-muted md:text-xl">{cta.subtitle}</p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <ButtonLink href={cta.primary.href} variant="primary" className="min-h-[3.25rem] !rounded px-7 text-[16px] font-extrabold">
              {cta.primary.label}
            </ButtonLink>
            <Link href={cta.secondary.href} className="inline-flex min-h-11 items-center text-[16px] font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
              {cta.secondary.label}
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
