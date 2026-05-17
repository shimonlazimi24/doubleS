"use client";

import { useRouter } from "next/navigation";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PREP_BASE } from "@/lib/prep/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui";

export function PrepSettingsClient() {
  const router = useRouter();

  async function signOut() {
    const client = createPrepSupabaseBrowserClient();
    if (client) await client.auth.signOut();
    router.push(`${PREP_BASE}/login`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Text as="p" variant="body">
        ניהול חשבון: התנתקות מסיימת את הסשן במכשיר זה.
      </Text>
      <Button type="button" variant="secondary" onClick={() => void signOut()}>
        התנתקות
      </Button>
    </div>
  );
}
