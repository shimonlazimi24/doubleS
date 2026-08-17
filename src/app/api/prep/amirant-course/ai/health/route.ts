import { NextResponse } from "next/server";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { getAiSystemHealth } from "@/lib/amirant-course/ai/ai-health";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

/**
 * Health probe — admin session OR `Authorization: Bearer ${CRON_SECRET|AI_HEALTH_SECRET}`.
 * Never returns API key material.
 */
export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "unknown";
  if (!(await checkAiRouteRateLimit({ key: `ip:${ip}`, route: "ai-health-get", maxRequests: 30 }))) {
    return NextResponse.json({ error: "יותר מדי בקשות" }, { status: 429 });
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const secret = process.env.AI_HEALTH_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  const bearerOk = Boolean(secret && auth === `Bearer ${secret}`);

  let adminOk = false;
  if (!bearerOk) {
    const client = createPrepSupabaseServerClient();
    if (client) {
      const {
        data: { user },
      } = await client.auth.getUser();
      adminOk = Boolean(user && isPrepAdminUser(user));
    }
  }

  if (!bearerOk && !adminOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = getPrepSupabaseServiceClient();
  try {
    const body = await getAiSystemHealth({ service });
    return NextResponse.json(body, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Health check failed";
    return NextResponse.json({ status: "error" as const, errorMessage: message }, { status: 500 });
  }
}
