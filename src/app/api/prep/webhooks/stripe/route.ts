import { NextResponse } from "next/server";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";
import { grantCourseEntitlement } from "@/lib/prep/entitlements";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { verifyStripeWebhookSignature } from "@/lib/prep/stripe";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!verifyStripeWebhookSignature({ payload, signatureHeader: signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const userId =
      (typeof session.client_reference_id === "string" && session.client_reference_id) ||
      (typeof session.metadata === "object" &&
        session.metadata &&
        typeof (session.metadata as Record<string, string>).user_id === "string" &&
        (session.metadata as Record<string, string>).user_id) ||
      null;
    const courseSlug =
      (typeof session.metadata === "object" &&
        session.metadata &&
        typeof (session.metadata as Record<string, string>).course_slug === "string" &&
        (session.metadata as Record<string, string>).course_slug) ||
      AMIRANT_PREPARATION_SLUG;

    const service = getPrepSupabaseServiceClient();
    if (userId && service) {
      await grantCourseEntitlement({
        client: service,
        userId,
        courseSlug,
        accessType: "paid",
      });
    }
  }

  return NextResponse.json({ received: true });
}
