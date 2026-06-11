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
    <ul
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line/80 bg-line/80 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.label} className="bg-paper px-4 py-3.5 text-right">
          <p className="font-brand text-lg font-semibold tabular-nums tracking-tight text-primary">
            {item.value}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}
