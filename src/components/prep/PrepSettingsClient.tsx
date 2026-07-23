"use client";

import { useRouter } from "next/navigation";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PREP_BASE } from "@/lib/prep/constants";

/** «ניהול חשבון» - פעולות שקטות בתחתית העמוד, בלי כפתורים מאיימים. */
export function PrepSettingsClient() {
  const router = useRouter();

  async function signOut() {
    const client = createPrepSupabaseBrowserClient();
    if (client) await client.auth.signOut();
    router.push(`${PREP_BASE}/login`);
    router.refresh();
  }

  return (
    <section className="border-t border-line/70 pt-6">
      <h2 className="text-lg font-bold text-primary">ניהול חשבון</h2>
      <p className="mt-2 text-sm text-muted">התנתקות מסיימת את הסשן במכשיר זה בלבד.</p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-muted underline-offset-4 transition hover:text-primary hover:underline"
      >
        התנתקות
      </button>
    </section>
  );
}
