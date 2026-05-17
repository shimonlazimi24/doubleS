import { NextResponse } from "next/server";
import { buildLlmsTxtBody } from "@/lib/prep/llms-txt-body";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export function GET() {
  const base = getPublicSiteUrl();
  const body = buildLlmsTxtBody(base);
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
