import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { createAmirantCheckoutSession, isStripeCheckoutConfigured } from "@/lib/prep/stripe";

export async function POST() {
  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json({ error: "Checkout is not configured" }, { status: 503 });
  }

  const client = createPrepSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await createAmirantCheckoutSession({
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
