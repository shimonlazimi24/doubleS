"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/design-system/cn";
import { AdminSignOutButton } from "./AdminSignOutButton";

/**
 * Only what actually works. The questions screen edits a CMS table that no live
 * quiz reads, so it is not in the nav; it stays reachable by URL until it is wired.
 */
const NAV = [
  { href: "/prep/admin", label: "סקירה", exact: true },
  { href: "/prep/admin/learners", label: "נרשמים" },
  { href: "/prep/admin/payments", label: "תשלומים" },
  { href: "/prep/admin/lessons", label: "שיעורים" },
  { href: "/prep/admin/settings", label: "סרטונים" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-paper px-4 sm:px-6">
        <Link href="/prep/admin" className="flex min-h-11 items-center gap-2 text-base font-bold text-ink">
          PREPARE
          <span className="text-sm font-normal text-muted">ניהול</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/prep"
            className="inline-flex min-h-11 items-center px-3 text-sm text-muted transition hover:text-ink"
          >
            לאתר
          </Link>
          <AdminSignOutButton />
        </div>
      </header>

      <div className="flex flex-1 flex-col sm:flex-row">
        <nav
          aria-label="ניהול"
          className="flex shrink-0 overflow-x-auto border-b border-line bg-paper px-2 sm:w-48 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-l sm:px-0 sm:py-4"
        >
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm transition sm:border-b-0 sm:border-s-2 sm:px-5",
                  active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* A <div>, not <main>: the /prep layout already owns the page's single main landmark. */}
        <div className="min-w-0 flex-1 px-4 py-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
