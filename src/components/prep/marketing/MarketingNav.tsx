"use client";

import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { PREP_BASE } from "@/lib/prep/constants";

const LINKS = [
  { href: PREP_BASE, label: "בית", exact: true },
  { href: `${PREP_BASE}/amirant`, label: "אמירנט" },
  { href: `${PREP_BASE}/blog`, label: "מדריכים" },
  { href: `${PREP_BASE}/about`, label: "אודות" },
] as const;

function NavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        // 44px tap target on phones (WCAG 2.5.5); the desktop row keeps its height.
        "relative inline-flex min-h-11 items-center px-1 text-sm font-medium transition-colors lg:min-h-10",
        active ? "text-ink" : "text-muted hover:text-ink",
      )}
    >
      {label}
      <span
        className={cn("absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-accent transition-opacity", active ? "opacity-100" : "opacity-0")}
        aria-hidden
      />
    </Link>
  );
}

/**
 * Two groups so the phone header is two tidy rows: logo and the course button
 * on the first, the page links on the second. On desktop both sit in one row.
 * The header is LTR (Latin wordmark); the nav is RTL so the reading order is
 * בית ← אמירנט ← אודות ← אזור אישי ← כניסה לקורס.
 */
export function MarketingNav() {
  return (
    <>
      <div dir="rtl" className="order-2 flex items-center gap-x-4 lg:order-3">
        <Link
          href={`${PREP_BASE}/settings`}
          className="hidden min-h-10 items-center px-1 text-sm font-medium text-muted transition-colors hover:text-ink lg:inline-flex"
        >
          אזור אישי
        </Link>
        <ButtonLink href={`${PREP_BASE}/amirant/course`} variant="primary" className="min-h-10 !rounded px-4 text-sm lg:px-5">
          כניסה לקורס
        </ButtonLink>
      </div>
      <nav
        dir="rtl"
        aria-label="ניווט ראשי"
        className="order-3 flex w-full items-center gap-x-6 border-t border-line/60 lg:order-2 lg:ms-auto lg:w-auto lg:border-0 lg:gap-x-8"
      >
        {LINKS.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} exact={"exact" in item ? item.exact : false} />
        ))}
        <Link
          href={`${PREP_BASE}/settings`}
          className="ms-auto inline-flex min-h-11 items-center px-1 text-sm font-medium text-muted transition-colors hover:text-ink lg:hidden"
        >
          אזור אישי
        </Link>
      </nav>
    </>
  );
}
