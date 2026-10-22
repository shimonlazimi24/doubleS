import { cn } from "@/lib/design-system/cn";

export type TrustItem = {
  value: string;
  label: string;
};

/** Figures from the course itself, as a strip of four. */
export function TrustIndicators({ items, className }: { items: readonly TrustItem[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-y-6 sm:grid-cols-4", className)}>
      {items.map((item, i) => (
        <li
          key={item.label}
          className={cn("px-5 text-right", i % 2 === 1 && "border-s border-line", "sm:border-s sm:border-line sm:first:border-s-0", i === 0 && "ps-0")}
        >
          <p className="text-3xl font-extrabold tabular-nums tracking-tight text-primary md:text-4xl">{item.value}</p>
          <p className="mt-1 text-sm leading-snug text-muted">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}
