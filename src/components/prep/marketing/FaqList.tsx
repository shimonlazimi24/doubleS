import type { AmirantFaqItem } from "@/lib/prep/marketing/amirant-seo-content";
import { Reveal } from "./motion/Reveal";

/**
 * The questions people ask before buying. Each opens on click; the answers
 * are in the HTML either way, which is what the FAQPage schema reads.
 */
export function FaqList({ items }: { items: readonly AmirantFaqItem[] }) {
  return (
    <Reveal className="max-w-3xl">
      {items.map((item) => (
        <details key={item.q} className="group border-t border-line last:border-b">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-right text-[17px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden className="shrink-0 text-2xl font-light leading-none text-muted transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="pb-6 text-[16px] leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </Reveal>
  );
}
