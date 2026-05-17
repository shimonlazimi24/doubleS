import { redirect } from "next/navigation";
import {
  AMIRANT_COURSE_HOME_PATH,
  resolveAmirantContinueDestination,
} from "@/lib/prep/amirant-continue";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

/** Funnel after the public hub: login → onboarding → pricing → course. */
export default async function AmirantContinuePage() {
  if (isPrepAuthBypassEnabled()) {
    redirect(AMIRANT_COURSE_HOME_PATH);
  }

  const client = createPrepSupabaseServerClient();
  let userId: string | null = null;
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }

  const destination = await resolveAmirantContinueDestination(client, userId);
  redirect(destination);
}
