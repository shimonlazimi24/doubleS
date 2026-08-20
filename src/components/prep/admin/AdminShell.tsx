"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

/**
 * Only what actually works. The questions screen edits a CMS table that no live
 * quiz reads — it was labelled "(לא פעיל)" in the nav, which tells an admin the
 * tool lies before they open it. It stays reachable by URL until it is wired.
 */
const NAV = [
  { href: "/prep/admin", label: "סקירה", exact: true },
  { href: "/prep/admin/lessons", label: "שיעורים" },
  { href: "/prep/admin/learners", label: "נרשמים" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const env = getPrepSupabasePublishableEnv();
    if (!env) return;
    const supabase = createBrowserClient(env.url, env.anonKey);
    await supabase.auth.signOut();
    router.push("/prep/login");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-paper border-b border-line flex items-center justify-between px-6 h-14">
        <span className="font-bold text-base tracking-widest text-ink">PREPARE <span className="text-muted font-normal text-sm">admin</span></span>
        <button
          onClick={handleLogout}
          className="text-xs text-muted hover:text-ink transition"
        >
          יציאה
        </button>
      </header>

      <div className="flex flex-1 flex-col sm:flex-row">
        {/* Sidebar */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-paper px-3 py-2 sm:w-52 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-l sm:py-6">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted hover:text-ink hover:bg-primary/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
