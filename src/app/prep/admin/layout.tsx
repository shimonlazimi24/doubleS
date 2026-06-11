"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

const NAV = [
  { href: "/prep/admin", label: "📊 Dashboard", exact: true },
  { href: "/prep/admin/lessons", label: "📖 שיעורים" },
  { href: "/prep/admin/questions", label: "❓ שאלות" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-52 shrink-0 bg-paper border-l border-line pt-6 flex flex-col gap-1 px-3">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm transition ${
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
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
