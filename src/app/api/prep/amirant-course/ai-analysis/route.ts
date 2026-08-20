import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { runAiAnalysis } from "@/lib/amirant-course/ai/analysis";
import { aiAnalysisResponseSchema } from "@/lib/amirant-course/ai/contract";
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

  const { requestIp } = getAiRequestMeta(req);
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

  if (
    !(await checkAiRouteRateLimit({
      key: `u:${user.id}`,
      route: "ai-analysis",
      maxRequests: 15,
    }))
  ) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }
  if (
    !(await checkAiRouteRateLimit({
      key: `i:${requestIp}`,
      route: "ai-analysis-ip",
      maxRequests: 20,
    }))
  ) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  try {
    const result = await runAiAnalysis(json);
    const res = aiAnalysisResponseSchema.parse(result);
    return NextResponse.json(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "הניתוח נכשל";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
