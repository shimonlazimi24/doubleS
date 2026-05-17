import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiRouteRateLimit, checkAiUserAndIpRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { runRecommendationsAi } from "@/lib/amirant-course/ai/recommendations";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { requestIp, sessionId } = getAiRequestMeta(req);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    if (!(await checkAiUserAndIpRateLimit({ userId: user.id, ip: requestIp, route: "recommendations" }))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  } else {
    if (!(await checkAiRouteRateLimit({ key: `i:${requestIp}`, route: "recommendations-guest", maxRequests: 20 }))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const data = await runRecommendationsAi(client, user?.id ?? null, body, { requestIp, sessionId });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recommendations failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
