import { NextResponse } from "next/server";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { getAiSystemHealth } from "@/lib/amirant-course/ai/ai-health";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";

/**
 * Unauthenticated health probe. Never returns API key material.
 * Optional: set `SUPABASE_SERVICE_ROLE_KEY` on the server for full RAG stats.
 */
export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "unknown";
  if (!(await checkAiRouteRateLimit({ key: `ip:${ip}`, route: "ai-health-get", maxRequests: 30 }))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const service = getPrepSupabaseServiceClient();
  try {
    const body = await getAiSystemHealth({ service });
    return NextResponse.json(body, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Health check failed";
    return NextResponse.json(
      {
        status: "error" as const,
        errorMessage: message,
      },
      { status: 500 },
    );
  }
}
