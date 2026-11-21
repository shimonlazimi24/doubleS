"use client";

import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PREP_BASE } from "@/lib/prep/constants";
import { clearLearnerStorage } from "@/lib/prep/clear-learner-storage";

/** «ניהול חשבון» - פעולות שקטות בתחתית העמוד, בלי כפתורים מאיימים. */
export function PrepSettingsClient() {
  async function signOut() {
    const client = createPrepSupabaseBrowserClient();
    // scope "local": the library default is "global", which revokes the session
    // on every other device and browser as well.
    if (client) await client.auth.signOut({ scope: "local" });
    clearLearnerStorage();
    // Full navigation, so nothing held in memory from this account survives.
    window.location.assign(`${PREP_BASE}/login`);
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
