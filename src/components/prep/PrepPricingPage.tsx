"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { Text } from "@/components/ui";

const COURSE = `${PREP_BASE}/amirant/course`;

export type PlanId = "week" | "two_weeks" | "month";

export const PLANS: {
  id: PlanId;
  label: string;
  duration: string;
  price: number;
  badge?: string;
  features: string[];
}[] = [
  {
    id: "week",
    label: "שבוע",
    duration: "7 ימים",
    price: 179,
    features: [
      "כל 8 מודולים + 4 סימולציות",
      "בוחנים אדפטיביים AI",
      "עוזר AI חי בכל שאלה",
      "דשבורד התקדמות אישי",
    ],
  },
  {
    id: "two_weeks",
    label: "שבועיים",
    duration: "14 ימים",
    price: 229,
    badge: "הנבחר",
    features: [
      "כל 8 מודולים + 4 סימולציות",
      "בוחנים אדפטיביים AI",
      "עוזר AI חי בכל שאלה",
      "דשבורד התקדמות אישי",
    ],
  },
  {
    id: "month",
    label: "חודש",
    duration: "30 ימים",
    price: 339,
    features: [
      "כל 8 מודולים + 4 סימולציות",
      "בוחנים אדפטיביים AI",
      "עוזר AI חי בכל שאלה",
      "דשבורד התקדמות אישי",
    ],
  },
];

export const EXTENSION_PLANS: {
  id: string;
  label: string;
  price: number;
  days: number;
}[] = [
  { id: "ext_week", label: "+שבוע", price: 20, days: 7 },
  { id: "ext_two_weeks", label: "+שבועיים", price: 50, days: 14 },
  { id: "ext_month", label: "+חודש", price: 70, days: 30 },
];

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function FreeBanner({ afterPayPath }: { afterPayPath: string | null }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">גישה פתוחה</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">הקורס פתוח חינם כרגע</h2>
      <Text as="p" variant="body" className="mt-2 text-muted">
        כל המודולים, בוחנים אדפטיביים, סימולציות ועוזר AI — זמינים ללא תשלום.
      </Text>
      <div className="mt-6">
        <Link
          href={afterPayPath ?? COURSE}
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-[#0f1e3d] px-6 text-sm font-bold text-white transition hover:bg-[#16306a]"
        >
          התחל ללמוד עכשיו ←
        </Link>
      </div>
    </div>
  );
}

export function PrepPricingPage({ mode = "purchase" }: { mode?: "purchase" | "extension" }) {
  const searchParams = useSearchParams();
  const lockedModule = searchParams.get("module");
  const checkoutState = searchParams.get("checkout");
  const afterPayPath = safeNextPath(searchParams.get("next"));

  const [selected, setSelected] = useState<PlanId>("two_weeks");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (getPrepHasFullAccess()) {
    return <FreeBanner afterPayPath={afterPayPath} />;
  }

  async function startCheckout(planId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/prep/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "לא ניתן לפתוח תשלום. התחברו קודם או פנו לתמיכה.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("שגיאת רשת. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  const currentPlan = PLANS.find((p) => p.id === selected)!;

  return (
    <div dir="rtl" className="space-y-6">
      {checkoutState === "cancel" && (
        <p className="rounded-xl border border-line/80 bg-canvas px-4 py-3 text-sm text-muted">
          התשלום בוטל. אפשר לנסות שוב בכל עת.
        </p>
      )}
      {lockedModule && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          כדי לגשת למודול «{lockedModule}» נדרשת רכישה. מודול המבוא פתוח תמיד.
        </p>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isSelected = plan.id === selected;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              className={`relative rounded-2xl border-2 p-5 text-right transition-all ${
                isSelected
                  ? "border-[#0f1e3d] bg-[#0f1e3d] text-white shadow-lg"
                  : "border-[#d6deec] bg-white text-[#0f1e3d] hover:border-[#0f1e3d]/40"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#d4a843] px-3 py-1 text-[10px] font-bold text-[#0f1e3d]">
                  {plan.badge}
                </span>
              )}
              <p className={`text-xs font-semibold uppercase tracking-wide ${isSelected ? "text-white/60" : "text-[#94a3b8]"}`}>
                {plan.duration}
              </p>
              <p className="mt-1 text-2xl font-bold">{plan.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${isSelected ? "text-[#d4a843]" : "text-[#0f1e3d]"}`}>
                ₪{plan.price}
              </p>
            </button>
          );
        })}
      </div>

      {/* What's included */}
      <div className={`rounded-2xl border p-5 ${selected === "two_weeks" ? "border-[#d4a843]/40 bg-[#fffdf5]" : "border-[#d6deec] bg-white"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6480]">כלול ב{currentPlan.label}</p>
        <ul className="mt-3 space-y-2">
          {currentPlan.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-[#0f1e3d]">
              <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.15" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startCheckout(selected)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f1e3d] px-8 text-sm font-bold text-white transition hover:bg-[#16306a] disabled:opacity-50"
          >
            {busy ? "מעביר לתשלום…" : `רכישה — ₪${currentPlan.price} ל${currentPlan.label}`}
          </button>
          <p className="text-xs text-[#94a3b8]">תשלום מאובטח · ביטול בכל עת</p>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Extension section */}
      <div className="rounded-2xl border border-[#d6deec] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6480]">הארכת גישה קיימת</p>
        <p className="mt-1 text-xs text-[#94a3b8]">כבר יש לך גישה ורוצה עוד זמן? הארך מבלי לאבד התקדמות.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXTENSION_PLANS.map((ext) => (
            <button
              key={ext.id}
              type="button"
              disabled={busy}
              onClick={() => void startCheckout(ext.id)}
              className="rounded-xl border border-[#d6deec] bg-[#f8faff] px-4 py-2 text-sm font-semibold text-[#0f1e3d] transition hover:border-[#0f1e3d]/40 hover:bg-white disabled:opacity-50"
            >
              {ext.label} — ₪{ext.price}
            </button>
          ))}
        </div>
      </div>

      {/* Fine print */}
      <div className="space-y-1 text-center text-xs text-[#94a3b8]">
        <p>הגישה ניתנת מיד לאחר אישור התשלום · ₪ (שקלים ישראלים)</p>
        <p>שאלות? <a href="mailto:support@getprepared.academy" className="underline">support@getprepared.academy</a></p>
      </div>
    </div>
  );
}
