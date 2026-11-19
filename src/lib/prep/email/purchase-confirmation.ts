import { formatDateHe } from "@/lib/prep/format-date-he";
import { PLAN_LABELS } from "@/lib/prep/pricing-plans";
import { escapeHtml, sendEmail, type SendEmailResult } from "@/lib/prep/email/resend";

const SITE = "https://getprepared.academy";
const SUPPORT = "support@getprepared.academy";

export type PurchaseConfirmationInput = {
  to: string;
  orderRef: string;
  planId: string;
  amountNis: number;
  endsAt: string | null;
};

export function buildPurchaseConfirmation(input: PurchaseConfirmationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const plan = PLAN_LABELS[input.planId] ?? input.planId;
  const until = input.endsAt ? formatDateHe(input.endsAt) : null;
  const courseUrl = `${SITE}/prep/amirant/continue`;

  const lines = [
    "התשלום התקבל והגישה לקורס פתוחה.",
    "",
    `תוכנית: ${plan}`,
    `סכום: ₪${input.amountNis}`,
    ...(until ? [`הגישה בתוקף עד: ${until}`] : []),
    `מספר הזמנה: ${input.orderRef}`,
    "",
    `כניסה לקורס: ${courseUrl}`,
    "",
    `שאלה או בעיה? עונים למייל הזה או כותבים ל-${SUPPORT}, עם מספר ההזמנה.`,
  ];

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 0 4px 16px;color:#666666">${label}</td><td style="padding:4px 0">${value}</td></tr>`;

  const html = `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:480px;margin:0 auto;text-align:right">
  <p style="font-size:18px;font-weight:bold;margin:0 0 16px">PREPARE</p>
  <p>התשלום התקבל והגישה לקורס פתוחה.</p>
  <table style="border-collapse:collapse;margin:16px 0">
    ${row("תוכנית", escapeHtml(plan))}
    ${row("סכום", `₪${input.amountNis}`)}
    ${until ? row("הגישה בתוקף עד", escapeHtml(until)) : ""}
    ${row("מספר הזמנה", `<span dir="ltr">${escapeHtml(input.orderRef)}</span>`)}
  </table>
  <p><a href="${courseUrl}" style="color:#1a1a1a;font-weight:bold">כניסה לקורס</a></p>
  <p style="color:#666666;font-size:13px;margin-top:24px">שאלה או בעיה? עונים למייל הזה או כותבים ל-${SUPPORT}, עם מספר ההזמנה.</p>
</div>`;

  return { subject: "הגישה לקורס PREPARE נפתחה", html, text: lines.join("\n") };
}

export async function sendPurchaseConfirmation(input: PurchaseConfirmationInput): Promise<SendEmailResult> {
  const { subject, html, text } = buildPurchaseConfirmation(input);
  return sendEmail({ to: input.to, subject, html, text, replyTo: SUPPORT });
}
