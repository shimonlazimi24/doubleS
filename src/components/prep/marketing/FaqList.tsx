import type { AmirantFaqItem } from "@/lib/prep/marketing/amirant-seo-content";

/** The questions people ask before buying, as plain open text: the same list feeds the FAQPage schema. */
export function FaqList({ items }: { items: readonly AmirantFaqItem[] }) {
  return (
    <dl className="max-w-3xl border-t border-line">
      {items.map((item) => (
        <div key={item.q} className="border-b border-line/70 py-4">
          <dt className="text-[15px] font-bold text-ink">{item.q}</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-muted">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
