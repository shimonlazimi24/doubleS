import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";

type Props = {
  title: string;
  body: string;
  icon?: ReactNode;
  className?: string;
};

export function FeatureCard({ title, body, icon, className }: Props) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-surface border border-line/80 bg-paper p-6 shadow-card transition hover:border-accent/30 hover:shadow-lift",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-control bg-accent-muted text-accent">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold leading-snug text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}
