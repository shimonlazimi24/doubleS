import { cn } from "@/lib/design-system/cn";

export type TrustItem = {
  value: number;
  label: string;
  /** Shown after the number, e.g. "+" when two counts are combined. */
  suffix?: string;
};

/** Figures from the course itself: big static numerals, no boxes, no count-up. */
export function TrustIndicators({ items, className }: { items: readonly TrustItem[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4", className)}>
      {items.map((item) => (
        <li key={item.label} className="text-right">
          <p className="text-[2.75rem] font-black leading-none tracking-tight text-primary md:text-[3.25rem]">
            {item.value.toLocaleString("en-US")}
            {item.suffix ?? ""}
          </p>
          <p className="mt-2 text-[15px] leading-snug text-muted">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}
