"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Entry direction; "none" only fades. */
  from?: "up" | "start" | "end" | "none";
  /** Stagger in ms. */
  delay?: number;
  as?: "div" | "section" | "li" | "figure";
};

/**
 * Reveals its content once when it scrolls into view. The CSS lives in
 * globals (.reveal / .is-visible) so the first paint already has the start
 * state; under prefers-reduced-motion the content is simply visible.
 */
export function Reveal({ children, className, from = "up", delay = 0, as = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as "div";
  return (
    <Tag ref={ref as never} className={cn("reveal", `reveal-${from}`, className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
