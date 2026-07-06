import { cn } from "@/lib/design-system/cn";

export type TrustItem = {
  value: string;
  label: string;
};

export function TrustIndicators({
  items,
  className,
}: {
  items: readonly TrustItem[];
  className?: string;
}) {
  return (
    // עמודות עם מפרידי קו-שיער (בלי קופסאות) — שקט ו"אקדמי".
    // RTL: border-s = הקצה הימני של הפריט; מדלגים על הראשון בכל שורה.
    <ul
      className={cn(
        "grid grid-cols-2 gap-y-4 border-t border-line pt-4 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item, i) => (
        <li
          key={item.label}
          className={cn(
            "px-4 text-right",
            i % 2 === 1 && "border-s border-line",
            "sm:border-s sm:border-line sm:first:border-s-0",
            i === 0 && "ps-0",
          )}
        >
          <p className="font-brand text-xl font-bold tabular-nums tracking-tight text-primary">
            {item.value}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}
