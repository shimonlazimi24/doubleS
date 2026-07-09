"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { PREP_BASE } from "@/lib/prep/constants";

const LINKS = [
  { href: PREP_BASE, label: "בית", exact: true },
  { href: `${PREP_BASE}/amirant`, label: "אמירנט" },
  { href: `${PREP_BASE}/about`, label: "אודות" },
] as const;

function NavLink({
  href,
  label,
  exact,
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex min-h-10 items-center px-1 text-sm font-medium transition-colors",
        active ? "text-ink" : "text-muted hover:text-ink",
      )}
    >
      {label}
      <span
        className={cn(
          "absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-accent transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
    </Link>
  );
}

export function MarketingNav() {
  return (
    <nav
      aria-label="ניווט ראשי"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:gap-x-8"
    >
      <ButtonLink
        href={`${PREP_BASE}/amirant/course`}
        variant="primary"
        className="min-h-10 px-5 text-sm shadow-cta"
      >
        כניסה לקורס
      </ButtonLink>
      <Link
        href={`${PREP_BASE}/login`}
        className="inline-flex min-h-10 items-center px-1 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        התחברות
      </Link>
      {/* תפריט «קורסים» הוסר — קורס חי אחד; יוחזר כשיהיו כמה (הקטלוג נשאר ב-/prep/courses) */}
      {LINKS.map((item) => (
        <NavLink key={item.href} href={item.href} label={item.label} exact={"exact" in item ? item.exact : false} />
      ))}
    </nav>
  );
}
