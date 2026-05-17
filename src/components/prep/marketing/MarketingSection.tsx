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
  tone?: "paper" | "canvas" | "navy";
};

const tones = {
  paper: "bg-paper",
  canvas: "bg-canvas",
  navy: "bg-primary text-paper",
} as const;

export function MarketingSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  tone = "paper",
}: Props) {
  const onNavy = tone === "navy";
  return (
    <section id={id} className={cn("py-section md:py-section-lg", tones[tone], className)}>
      <Container max="shell">
        <header className="mb-8 max-w-2xl md:mb-9">
          {eyebrow ? (
            <p
              className={cn(
                "mb-2 text-xs font-semibold uppercase tracking-[0.14em]",
                onNavy ? "text-sky-300" : "text-accent",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={cn(
              "text-2xl font-semibold leading-tight tracking-tight md:text-3xl",
              onNavy ? "text-paper" : "text-ink",
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className={cn("mt-3 text-base leading-relaxed md:text-lg", onNavy ? "text-slate-300" : "text-muted")}>
              {subtitle}
            </p>
          ) : null}
        </header>
        {children}
      </Container>
    </section>
  );
}
