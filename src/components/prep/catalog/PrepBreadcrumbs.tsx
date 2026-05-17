import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";

export type PrepBreadcrumbItem = { label: string; href?: string };

export function PrepBreadcrumbs({ items }: { items: PrepBreadcrumbItem[] }) {
  return (
    <nav aria-label="מיקום בעמוד" className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href={PREP_BASE} className="hover:text-primary">
            בית
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <span className="opacity-60" aria-hidden>
              ‹
            </span>
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
