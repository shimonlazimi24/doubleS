import { NextResponse } from "next/server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { aiAnalysisResponseSchema } from "@/lib/amirant-course/ai/contract";
import { runAiAnalysis } from "@/lib/amirant-course/ai/analysis";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!(await checkAiRouteRateLimit({ key: ip, route: "ai-analysis", maxRequests: 30 }))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await runAiAnalysis(json);
    const res = aiAnalysisResponseSchema.parse(result);
    return NextResponse.json(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
