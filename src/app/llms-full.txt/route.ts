import { NextResponse } from "next/server";
import { listBlogPosts } from "@/lib/prep/blog.server";
import { buildLlmsFullTxtBody } from "@/lib/prep/llms-full-txt-body";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

// Built at build time: content/blog is read with fs and is not shipped in the function.
export const dynamic = "force-static";

export function GET() {
  const body = buildLlmsFullTxtBody(getPublicSiteUrl(), listBlogPosts());
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
