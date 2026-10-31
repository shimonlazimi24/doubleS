"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/design-system/cn";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";

/** Signs out and goes to the login screen; `next` brings the person back after signing in again. */
export function AdminSignOutButton({
  label = "יציאה",
  next,
  className,
}: {
  label?: string;
  next?: string;
  className?: string;
}) {
  const router = useRouter();

  async function signOut() {
    const env = getPrepSupabasePublishableEnv();
    if (env) await createBrowserClient(env.url, env.anonKey).auth.signOut();
    router.push(next ? `/prep/login?next=${encodeURIComponent(next)}` : "/prep/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={cn("inline-flex min-h-11 items-center px-3 text-sm text-muted transition hover:text-ink", className)}
    >
      {label}
    </button>
  );
}
