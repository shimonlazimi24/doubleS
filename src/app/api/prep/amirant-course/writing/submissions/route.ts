import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { getWritingStore } from "@/lib/amirant-course/writing/submissions.server";

/** The learner's own essays and verdicts, newest first; `?taskId=` narrows to one task. */
export async function GET(req: Request) {
  const client = createPrepSupabaseServerClient();
  let userId: string | null = null;
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId && !getPrepHasFullAccess()) {
    return NextResponse.json({ error: "יש להתחבר." }, { status: 401 });
  }
  const taskId = new URL(req.url).searchParams.get("taskId")?.trim() || undefined;
  const { store } = getWritingStore();
  const submissions = await store.list(userId ?? "local-dev", taskId);
  return NextResponse.json({ submissions });
}
