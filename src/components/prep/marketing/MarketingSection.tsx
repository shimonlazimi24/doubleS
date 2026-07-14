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

/** מקצב עריכתי הדוק: קו-שיער בין סקשנים, ריווח מתון, כותרת צמודה לתוכן. */
export function MarketingSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  tone = "paper",
}: Props) {
  return (
    <section
      id={id}
      className={cn("border-t border-line/70 py-10 md:py-14", tones[tone], className)}
    >
      <Container max="shell">
        <header className="mb-6 max-w-2xl text-right md:mb-7">
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-ink md:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-base leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </header>
        {children}
      </Container>
    </section>
  );
}
