/**
 * Resend "email.received" webhook: mail sent to an address at getprepared.academy
 * (support@ and the rest) is forwarded to the team's real inbox, with Reply-To set
 * to the original sender so a plain reply reaches the learner.
 *
 * Needs RESEND_WEBHOOK_SECRET, SUPPORT_FORWARD_TO and a full-access RESEND_API_KEY.
 * Until those are set the mail is still kept in Resend's dashboard (Emails, Receiving).
 */
import { NextResponse } from "next/server";
import { escapeHtml, getReceivedEmail, sendEmail } from "@/lib/prep/email/resend";
import { verifySvixSignature } from "@/lib/prep/email/svix-signature";

export const runtime = "nodejs";

type ReceivedEvent = { type?: string; data?: { email_id?: string } };

/** "Name <a@b.c>" or "a@b.c" -> "a@b.c" */
function addressOf(from: string): string | null {
  const match = from.match(/<([^<>\s]+@[^<>\s]+)>/) ?? from.match(/^\s*([^<>\s]+@[^<>\s]+)\s*$/);
  return match?.[1] ?? null;
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const forwardTo = process.env.SUPPORT_FORWARD_TO?.trim();
  if (!secret || !forwardTo) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const body = await req.text();
  const verified = verifySvixSignature({
    secret,
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signature: req.headers.get("svix-signature"),
    body,
  });
  if (!verified) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: ReceivedEvent;
  try {
    event = JSON.parse(body) as ReceivedEvent;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const emailId = event.data?.email_id;
  if (event.type !== "email.received" || !emailId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const email = await getReceivedEmail(emailId);
  if (!email) {
    // A 5xx makes Resend retry; the original stays in its dashboard either way.
    // eslint-disable-next-line no-console -- surfaced to Sentry via console capture
    console.error(`[inbound-email] could not read received email ${emailId}`);
    return NextResponse.json({ error: "email unavailable" }, { status: 502 });
  }

  const sender = addressOf(email.from);
  const header = `מאת: ${email.from}\nאל: ${email.to.join(", ")}`;
  const text = `${header}\n\n${email.text ?? "(ההודעה נשלחה ללא גרסת טקסט)"}`;
  const html = `<p dir="rtl" style="font-family:Arial,sans-serif;font-size:13px;color:#666666">${escapeHtml(header).replace(/\n/g, "<br>")}</p><hr>${
    email.html ?? `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(email.text ?? "")}</pre>`
  }`;

  const result = await sendEmail({
    to: forwardTo,
    from: "PREPARE - פניות <noreply@getprepared.academy>",
    subject: email.subject?.trim() || "(ללא נושא)",
    html,
    text,
    replyTo: sender ?? undefined,
  });
  if (!result.ok) {
    // eslint-disable-next-line no-console -- surfaced to Sentry via console capture
    console.error(`[inbound-email] forward failed for ${emailId}: ${result.reason}`);
    return NextResponse.json({ error: "forward failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
