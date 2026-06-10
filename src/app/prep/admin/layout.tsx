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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 h-14">
        <span className="font-bold text-base tracking-widest text-white">PREPARE <span className="text-zinc-500 font-normal text-sm">admin</span></span>
        <button
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-white transition"
        >
          יציאה ←
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-52 shrink-0 bg-zinc-900 border-r border-zinc-800 pt-6 flex flex-col gap-1 px-3">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
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
