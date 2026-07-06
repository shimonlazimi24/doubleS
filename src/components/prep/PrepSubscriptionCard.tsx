import Link from "next/link";
import { PLAN_LABELS } from "@/lib/prep/pricing-plans";
import { PREP_BASE } from "@/lib/prep/constants";
import { formatDateHe } from "@/lib/prep/format-date-he";
import { Text } from "@/components/ui";

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

export function PrepSubscriptionCard({ subscription }: { subscription: SubscriptionInfo }) {
  const remaining = daysLeft(subscription.endsAt);
  return (
    <div className="space-y-5" dir="rtl">
      <div className="rounded-2xl border border-line/80 bg-paper p-6">
        <Text as="p" variant="labelAccent" className="text-primary">
          המנוי שלי
        </Text>
        {subscription.active ? (
          <div className="mt-3 space-y-1">
            <p className="text-lg font-bold text-ink">
              גישה פעילה{subscription.accessType === "admin" ? " (מנהל)" : ""}
            </p>
            <p className="text-sm text-muted">
              בתוקף עד {formatDateHe(subscription.endsAt)}
              {remaining != null ? ` · נותרו ${remaining} ימים` : ""}
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-1">
            <p className="text-lg font-bold text-ink">אין מנוי פעיל</p>
            <p className="text-sm text-muted">רכשו גישה כדי לפתוח את כל הקורס, הסימולציות והעוזר האישי.</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`${PREP_BASE}/pricing`}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white"
          >
            {subscription.active ? "הארכת גישה" : "רכישת גישה"}
          </Link>
        </div>
      </div>

      {subscription.payments.length > 0 ? (
        <div className="rounded-2xl border border-line/80 bg-paper p-6">
          <Text as="p" variant="labelAccent" className="text-primary">
            היסטוריית תשלומים
          </Text>
          <ul className="mt-3 divide-y divide-line/60">
            {subscription.payments.map((p) => (
              <li key={p.orderRef} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{PLAN_LABELS[p.planId] ?? p.planId}</p>
                  <p className="text-xs text-muted">{formatDateHe(p.paidAt)}</p>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ink">₪{Number(p.amountNis).toFixed(0)}</p>
                  <p className="text-xs text-muted">{STATUS_LABEL_HE[p.status] ?? p.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
