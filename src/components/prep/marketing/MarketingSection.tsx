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
  tone?: "paper" | "canvas";
};

const tones = {
  paper: "bg-paper",
  canvas: "bg-canvas",
} as const;

/** A section of the marketing pages: a hairline above, a heading, the content. No decoration. */
export function MarketingSection({ id, eyebrow, title, subtitle, children, className, tone = "paper" }: Props) {
  return (
    <section id={id} className={cn("border-t border-line py-12 md:py-16", tones[tone], className)}>
      <Container max="shell">
        <header className="mb-7 max-w-2xl text-right">
          {eyebrow ? <p className="mb-1.5 text-sm font-semibold text-muted">{eyebrow}</p> : null}
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-[1.75rem]">{title}</h2>
          {subtitle ? <p className="mt-2 text-base leading-relaxed text-muted">{subtitle}</p> : null}
        </header>
        {children}
      </Container>
    </section>
  );
}
