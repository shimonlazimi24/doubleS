import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiUserAndIpRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { runRecommendationsAi } from "@/lib/amirant-course/ai/recommendations";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    // No Supabase client means the caller's identity cannot be established, so
    // the honest answer is "unauthenticated", not "server error": a 500 here
    // pages on ordinary anonymous traffic and hides the real cause. The
    // misconfiguration is logged instead of being returned to the caller.
    // eslint-disable-next-line no-console -- silent misconfiguration is how the checkout outage stayed hidden
    console.error("[ai] Supabase is not configured — AI routes are locked to anonymous.");
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const { requestIp, sessionId } = getAiRequestMeta(req);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const entitled = getPrepHasFullAccess() || (await hasAmirantFullAccess(client, user.id));
  if (!entitled) {
    return NextResponse.json({ error: "נדרשת גישה מלאה לקורס" }, { status: 403 });
  }

  if (!(await checkAiUserAndIpRateLimit({ userId: user.id, ip: requestIp, route: "recommendations" }))) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  try {
    const data = await runRecommendationsAi(client, user.id, body, { requestIp, sessionId });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "המלצות נכשלו";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
