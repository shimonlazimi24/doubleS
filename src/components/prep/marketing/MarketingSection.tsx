import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

type Props = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** paper: white; low: light slate; navy: dark band with white text. */
  tone?: "paper" | "low" | "navy";
};

const tones = {
  paper: "bg-paper text-ink",
  low: "bg-surface-low text-ink",
  navy: "bg-primary text-white",
} as const;

/**
 * A section of the marketing pages: generous vertical room, a heading with a
 * short lead on a readable measure, then the content. Tone alternation does
 * the separating; no hairline between sections.
 */
export function MarketingSection({ id, eyebrow, title, subtitle, children, className, tone = "paper" }: Props) {
  const navy = tone === "navy";
  return (
    <section id={id} className={cn("scroll-mt-20 py-16 md:py-24", tones[tone], className)}>
      <Container max="shell">
        <header className="mb-10 max-w-[38rem] text-right md:mb-12">
          {eyebrow ? <p className={cn("mb-2 text-sm font-semibold", navy ? "text-white/70" : "text-primary")}>{eyebrow}</p> : null}
          <h2 className="text-[1.9rem] font-extrabold leading-[1.15] tracking-tight md:text-[2.4rem]">{title}</h2>
          {subtitle ? <p className={cn("mt-3 text-lg leading-relaxed", navy ? "text-white/80" : "text-muted")}>{subtitle}</p> : null}
        </header>
        {children}
      </Container>
    </section>
  );
}
