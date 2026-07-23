import Link from "next/link";
import { PLAN_LABELS } from "@/lib/prep/pricing-plans";
import { PREP_BASE } from "@/lib/prep/constants";
import { formatDateHe } from "@/lib/prep/format-date-he";

export type SubscriptionInfo = {
  active: boolean;
  accessType: string | null;
  endsAt: string | null;
  payments: Array<{
    orderRef: string;
    planId: string;
    amountNis: number;
    status: string;
    paidAt: string | null;
  }>;
};

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

const STATUS_LABEL_HE: Record<string, string> = {
  paid: "שולם",
  pending: "בעיבוד",
  failed: "נכשל",
  cancelled: "בוטל",
  refunded: "זוכה",
};

/** שורת מנוי אחת רזה: סטטוס + תוקף + פעולה אחת, ותשלומים כשורות שקטות. */
export function PrepSubscriptionCard({ subscription }: { subscription: SubscriptionInfo }) {
  const remaining = daysLeft(subscription.endsAt);
  return (
    <section dir="rtl">
      <h2 className="text-lg font-bold text-primary">מנוי וגישה</h2>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md border border-line/80 bg-paper px-5 py-4">
        {subscription.active ? (
          <>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-score" aria-hidden="true" />
                גישה פעילה{subscription.accessType === "admin" ? " (מנהל)" : ""}
              </p>
              <p className="mt-1 text-sm text-muted">
                בתוקף עד {formatDateHe(subscription.endsAt)}
                {remaining != null ? ` · נותרו ${remaining} ימים` : ""}
              </p>
            </div>
            <Link
              href={`${PREP_BASE}/pricing`}
              className="inline-flex min-h-10 shrink-0 items-center rounded-control border border-line bg-paper px-4 text-sm font-semibold text-primary transition hover:border-primary/35 hover:bg-surface-low"
            >
              הארכת גישה
            </Link>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">אין מנוי פעיל</p>
              <p className="mt-1 text-sm text-muted">
                רכשו גישה כדי לפתוח את כל הקורס, הסימולציות והעוזר האישי.
              </p>
            </div>
            <Link
              href={`${PREP_BASE}/pricing`}
              className="inline-flex min-h-10 shrink-0 items-center rounded-control bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              רכישת גישה
            </Link>
          </>
        )}
      </div>

      {subscription.payments.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink">היסטוריית תשלומים</h3>
          <ul className="mt-1 divide-y divide-line/60">
            {subscription.payments.map((p) => (
              <li key={p.orderRef} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{PLAN_LABELS[p.planId] ?? p.planId}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatDateHe(p.paidAt)}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="font-semibold text-ink">₪{Number(p.amountNis).toFixed(0)}</p>
                  <p className="mt-0.5 text-xs text-muted">{STATUS_LABEL_HE[p.status] ?? p.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
