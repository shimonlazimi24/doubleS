import { buildLlmsTxtBody } from "@/lib/prep/llms-txt-body";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export const dynamic = "force-static";

/** אותו מסמך ידע כמו `/llms.txt` בשורש - מקור אחד, בלי סחיפת עובדות. */
export function GET() {
  return new Response(buildLlmsTxtBody(getPublicSiteUrl()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
