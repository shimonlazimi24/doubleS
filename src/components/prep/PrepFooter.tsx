import Link from "next/link";
import { PREP_BRAND_LATIN, PREP_BRAND_NAV_HE } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container } from "@/components/ui";

const footerLinks = [
  { href: `${PREP_BASE}/about`, label: "אודות" },
  { href: `${PREP_BASE}/contact`, label: "יצירת קשר" },
  { href: `${PREP_BASE}/privacy`, label: "מדיניות פרטיות" },
] as const;

export function PrepFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="flex flex-col gap-ds-8 py-ds-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-base font-medium text-ink">{PREP_BRAND_LATIN}</p>
          <p className="mt-2 text-sm leading-body text-muted">{PREP_BRAND_NAV_HE}</p>
        </div>
        <nav aria-label="תחתית האתר" className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
      <div className="bg-surface-low/80">
        <Container className="py-ds-3 text-xs text-muted">
          © {new Date().getFullYear()} {PREP_BRAND_LATIN}. כל הזכויות שמורות.
        </Container>
      </div>
    </footer>
  );
}
