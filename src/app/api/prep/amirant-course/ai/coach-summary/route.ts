import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiUserAndIpRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { runCoachSummaryAi } from "@/lib/amirant-course/ai/coach-summary";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { requestIp, sessionId } = getAiRequestMeta(req);
  if (!(await checkAiUserAndIpRateLimit({ userId: user.id, ip: requestIp, route: "coach-summary" }))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const data = await runCoachSummaryAi(client, user.id, body, { requestIp, sessionId });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coach summary failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
