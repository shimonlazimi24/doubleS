import type { AmirantFaqItem } from "@/lib/prep/marketing/amirant-seo-content";
import { SectionPanel } from "./SectionPanel";

/**
 * The questions people ask before buying. Each opens on click; the same list
 * feeds the FAQPage schema, so the answers are in the HTML either way.
 */
export function FaqList({ items }: { items: readonly AmirantFaqItem[] }) {
  return (
    <SectionPanel className="max-w-3xl">
      {items.map((item) => (
        <details key={item.q} className="group border-t border-line/70 first:border-t-0">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-right text-[15px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden className="shrink-0 text-xl font-normal text-muted transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </SectionPanel>
  );
}
