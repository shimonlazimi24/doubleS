import type { Metadata } from "next";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { assertServiceRoleKeyForWrites } from "@/lib/prep/supabase/service-role-check";
import { PLAN_LABELS } from "@/lib/prep/pricing-plans";

export const metadata: Metadata = { title: "תשלומים | PREPARE admin" };
export const dynamic = "force-dynamic";

type PaymentRow = {
  order_ref: string;
  user_id: string;
  plan_id: string;
  amount_nis: number;
  status: string;
  hyp_transaction_id: string | null;
  hyp_acode: string | null;
  hyp_ccode: string | null;
  raw_callback: Record<string, unknown> | null;
  entitlement_ends_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "ממתין",
  paid: "שולם",
  failed: "נכשל",
  cancelled: "בוטל",
  refunded: "הוחזר",
};

/** A pending row older than this never got its callback: the learner left Hyp, or Hyp never called us back. */
const STALE_PENDING_MS = 30 * 60 * 1000;

function fmt(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** One line that says what went wrong, from what the callback left behind. */
function diagnose(row: PaymentRow, now: number): string {
  if (row.status === "paid") return row.entitlement_ends_at ? "" : "שולם, אבל ההענקה לא נרשמה";
  if (row.status === "pending") {
    return now - Date.parse(row.created_at) > STALE_PENDING_MS
      ? "לא הגיע callback: הלקוח עזב את דף התשלום, או שכתובת ההצלחה/שגיאה לא מוגדרת בפורטל Hyp"
      : "הלקוח עדיין בדף התשלום";
  }
  if (row.raw_callback && (row.raw_callback as { _mismatch?: string })._mismatch === "amount") {
    return `הסכום שחזר מ-Hyp (${String(row.raw_callback.Amount ?? "?")}) שונה מהמחיר`;
  }
  if (row.hyp_ccode && row.hyp_ccode !== "0") return `Hyp דחה את העסקה (קוד ${row.hyp_ccode})`;
  if (!row.raw_callback) return "נכשל לפני שנפתח דף התשלום (חתימת Hyp)";
  return "";
}

/**
 * Every checkout attempt, newest first, with what the callback reported.
 *
 * The learners page shows who holds access; this page shows the attempts that
 * did or did not get there. Rows are written by the checkout route (pending)
 * and the Hyp callback (paid / failed), so a purchase that "doesn't work" leaves
 * its trace here: a stale pending row, a CCode from Hyp, or an amount mismatch.
 */
async function loadPayments(): Promise<{ rows: PaymentRow[]; emails: Map<string, string>; error: string | null }> {
  const service = getPrepSupabaseServiceClient();
  const keyStatus = assertServiceRoleKeyForWrites("admin/payments");
  if (!service || !keyStatus.ok) {
    return { rows: [], emails: new Map(), error: "מפתח ה-service של Supabase אינו מוגדר, ולכן אי אפשר לקרוא תשלומים." };
  }
  const { data, error } = await service
    .from("prep_payments")
    .select(
      "order_ref,user_id,plan_id,amount_nis,status,hyp_transaction_id,hyp_acode,hyp_ccode,raw_callback,entitlement_ends_at,paid_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { rows: [], emails: new Map(), error: `קריאת התשלומים נכשלה: ${error.message}` };

  const rows = (data ?? []) as PaymentRow[];
  const emails = new Map<string, string>();
  if (rows.length > 0) {
    const { data: users } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of users?.users ?? []) if (user.email) emails.set(user.id, user.email);
  }
  return { rows, emails, error: null };
}

export default async function AdminPaymentsPage() {
  const { rows, emails, error } = await loadPayments();
  const now = Date.now();
  const paid = rows.filter((r) => r.status === "paid").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const stale = rows.filter((r) => r.status === "pending" && now - Date.parse(r.created_at) > STALE_PENDING_MS).length;

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">תשלומים</h1>
        <p className="mt-1 text-sm text-muted">
          {rows.length} ניסיונות אחרונים · {paid} שולמו · {failed} נכשלו · {stale} נשארו ממתינים בלי callback
        </p>
      </div>

      {error ? (
        <p className="rounded-surface border border-line bg-paper p-4 text-sm text-ink">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">עוד לא נוצר אף ניסיון תשלום.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs font-bold text-muted">
                <th className="py-2 pe-3 text-start">נוצר</th>
                <th className="py-2 pe-3 text-start">מייל</th>
                <th className="py-2 pe-3 text-start">תוכנית</th>
                <th className="py-2 pe-3 text-start">₪</th>
                <th className="py-2 pe-3 text-start">מצב</th>
                <th className="py-2 pe-3 text-start">Hyp</th>
                <th className="py-2 pe-3 text-start">מה קרה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const note = diagnose(row, now);
                return (
                  <tr key={row.order_ref} className="border-b border-line/60 align-top">
                    <td className="py-2.5 pe-3 whitespace-nowrap tabular-nums text-muted">{fmt(row.created_at)}</td>
                    <td className="py-2.5 pe-3 text-ink" dir="ltr" style={{ textAlign: "left" }}>
                      {emails.get(row.user_id) ?? row.user_id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 pe-3 whitespace-nowrap">{PLAN_LABELS[row.plan_id] ?? row.plan_id}</td>
                    <td className="py-2.5 pe-3 tabular-nums">{row.amount_nis}</td>
                    <td className="py-2.5 pe-3 whitespace-nowrap font-semibold">
                      {STATUS_LABEL[row.status] ?? row.status}
                      {row.status === "paid" && row.paid_at ? (
                        <span className="ms-1 font-normal text-muted">{fmt(row.paid_at)}</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pe-3 whitespace-nowrap tabular-nums text-muted" dir="ltr" style={{ textAlign: "left" }}>
                      {row.hyp_transaction_id ?? "—"}
                      {row.hyp_ccode != null ? ` · CCode ${row.hyp_ccode}` : ""}
                    </td>
                    <td className="py-2.5 pe-3 text-ink">
                      {note}
                      {row.status === "paid" && row.entitlement_ends_at ? (
                        <span className="text-muted">גישה עד {row.entitlement_ends_at.slice(0, 10)}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted">
        הענקה קורית רק ב-callback המאומת מ-Hyp (/api/prep/checkout/callback). שורה שנשארה במצב ממתין אחרי חצי שעה
        אומרת שה-callback לא הגיע; זו כמעט תמיד הגדרת כתובת ההצלחה/שגיאה בפורטל Hyp.
      </p>
    </div>
  );
}
