import { cn } from "@/lib/design-system/cn";

export function TrustChips({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((label) => (
        <li
          key={label}
          className="rounded-full border border-line/80 bg-paper/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur-sm"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
