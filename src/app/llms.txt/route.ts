import { NextResponse } from "next/server";
import { listBlogPosts } from "@/lib/prep/blog.server";
import { buildLlmsTxtBody } from "@/lib/prep/llms-txt-body";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export const dynamic = "force-static";

export function GET() {
  const base = getPublicSiteUrl();
  const body = buildLlmsTxtBody(base, listBlogPosts());
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
