"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PrepBrandLogo } from "@/components/prep/PrepBrandLogo";
import { Container } from "@/components/ui";
import { PREP_BRAND_LATIN, PREP_BRAND_TAGLINE_HE } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";

const footerLinks = [
  { href: `${PREP_BASE}/about`, label: "אודות" },
  { href: `${PREP_BASE}/contact`, label: "יצירת קשר" },
  { href: `${PREP_BASE}/pricing`, label: "מחירים" },
  { href: `${PREP_BASE}/terms`, label: "תקנון שימוש" },
  { href: `${PREP_BASE}/privacy`, label: "מדיניות פרטיות" },
] as const;

export function MarketingFooter() {
  const pathname = usePathname() ?? "";
  // Course shell has its own sticky chrome + FAB — marketing footer fights for space.
  if (pathname.startsWith(`${PREP_BASE}/amirant/course`)) return null;

  return (
    <footer className="border-t border-line bg-paper">
      <Container className="flex flex-col gap-10 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <PrepBrandLogo size="footer" />
          <p className="mt-4 text-sm leading-relaxed text-muted">{PREP_BRAND_TAGLINE_HE}</p>
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
        <Container className="py-3 text-xs text-muted">
          © {new Date().getFullYear()} {PREP_BRAND_LATIN}. כל הזכויות שמורות.
        </Container>
      </div>
    </footer>
  );
}
