"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readUtmParams, trackEvent } from "@/lib/prep/analytics";
import { PLAN_DAYS, PLAN_PRICES_NIS } from "@/lib/prep/pricing-plans";

export type PlanId = "week" | "two_weeks" | "month";

const SHARED_FEATURES = [
  "כל המודולים + 6 סימולציות מלאות",
  "בוחנים אדפטיביים לפי הרמה שלך",
  "עוזר AI אישי בכל שיעור",
  "דשבורד התקדמות אישי",
];

/**
 * מחירים וימים מגיעים מ-pricing-plans.ts — אותו מקור שה-checkout מחייב לפיו.
 * כאן רק קופי שיווקי (תוויות, badge, פיצ'רים) — כדי שעדכון מחיר לא יציג
 * מחיר אחד ויחייב אחר.
 */
export const PLANS: {
  id: PlanId;
  label: string;
  duration: string;
  price: number;
  badge?: string;
  features: string[];
}[] = [
  { id: "week", label: "שבוע", duration: `${PLAN_DAYS.week} ימים`, price: PLAN_PRICES_NIS.week!, features: SHARED_FEATURES },
  {
    id: "two_weeks",
    label: "שבועיים",
    duration: `${PLAN_DAYS.two_weeks} ימים`,
    price: PLAN_PRICES_NIS.two_weeks!,
    badge: "הנבחר",
    features: SHARED_FEATURES,
  },
  { id: "month", label: "חודש", duration: `${PLAN_DAYS.month} ימים`, price: PLAN_PRICES_NIS.month!, features: SHARED_FEATURES },
];

export const EXTENSION_PLANS: {
  id: string;
  label: string;
  price: number;
  days: number;
}[] = [
  { id: "ext_week", label: "+שבוע", price: PLAN_PRICES_NIS.ext_week!, days: PLAN_DAYS.ext_week! },
  { id: "ext_two_weeks", label: "+שבועיים", price: PLAN_PRICES_NIS.ext_two_weeks!, days: PLAN_DAYS.ext_two_weeks! },
  { id: "ext_month", label: "+חודש", price: PLAN_PRICES_NIS.ext_month!, days: PLAN_DAYS.ext_month! },
];

// שמות עבריים ל-slugs של מודולים — שלא יופיע «sentence-completion» למשתמש
const MODULE_LABEL_HE: Record<string, string> = {
  vocabulary: "אוצר מילים",
  "sentence-completion": "השלמת משפטים",
  "sentence-rephrasing": "ניסוח מחדש",
  "reading-comprehension": "הבנת הנקרא",
  "new-exam-format-2026": "הרפורמה החדשה",
  "full-simulations": "סימולציות מלאות",
  "tips-strategies": "טיפים ואסטרטגיות",
  "course-summary": "סיכום הקורס",
};

export function PrepPricingPage() {
  const searchParams = useSearchParams();
  const lockedModuleSlug = searchParams.get("module");
  const lockedModule = lockedModuleSlug ? MODULE_LABEL_HE[lockedModuleSlug] ?? lockedModuleSlug : null;
  const checkoutState = searchParams.get("checkout");

  const [selected, setSelected] = useState<PlanId>("two_weeks");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("view_pricing", {});
  }, []);

  function selectPlan(planId: PlanId) {
    setSelected(planId);
    trackEvent("select_plan", { plan: planId });
  }

  async function startCheckout(planId: string) {
    setError(null);
    setBusy(true);
    trackEvent("begin_checkout", { plan: planId });
    try {
      const res = await fetch("/api/prep/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, utm: readUtmParams() ?? undefined }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        trackEvent("checkout_failed", { plan: planId, stage: "create" });
        setError(data.error ?? "לא ניתן לפתוח תשלום. התחברו קודם או פנו לתמיכה.");
        return;
      }
      window.location.href = data.url;
    } catch {
      trackEvent("checkout_failed", { plan: planId, stage: "network" });
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
              onClick={() => selectPlan(plan.id)}
              className={`relative rounded-2xl border-2 p-5 text-right transition-all ${
                isSelected
                  ? "border-primary bg-primary text-white shadow-lg"
                  : "border-line bg-white text-primary hover:border-primary/40"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-score px-3 py-1 text-[10px] font-bold text-primary">
                  {plan.badge}
                </span>
              )}
              <p className={`text-xs font-semibold uppercase tracking-wide ${isSelected ? "text-white/60" : "text-muted-2"}`}>
                {plan.duration}
              </p>
              <p className="mt-1 text-2xl font-bold">{plan.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${isSelected ? "text-score" : "text-primary"}`}>
                ₪{plan.price}
              </p>
            </button>
          );
        })}
      </div>

      {/* What's included */}
      <div className={`rounded-2xl border p-5 ${selected === "two_weeks" ? "border-score/40 bg-score/5" : "border-line bg-white"}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">כלול ב{currentPlan.label}</p>
        <ul className="mt-3 space-y-2">
          {currentPlan.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-primary">
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
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? "מעביר לתשלום…" : `רכישה — ₪${currentPlan.price} ל${currentPlan.label}`}
          </button>
          <p className="text-xs text-muted-2">תשלום מאובטח · ביטול בכל עת</p>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Extension section */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">הארכת גישה קיימת</p>
        <p className="mt-1 text-xs text-muted-2">כבר יש לך גישה ורוצה עוד זמן? הארך מבלי לאבד התקדמות.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXTENSION_PLANS.map((ext) => (
            <button
              key={ext.id}
              type="button"
              disabled={busy}
              onClick={() => void startCheckout(ext.id)}
              className="rounded-xl border border-line bg-surface-low px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-white disabled:opacity-50"
            >
              {ext.label} — ₪{ext.price}
            </button>
          ))}
        </div>
      </div>

      {/* Fine print */}
      <div className="space-y-1 text-center text-xs text-muted-2">
        <p>הגישה ניתנת מיד לאחר אישור התשלום · ₪ (שקלים ישראלים)</p>
        <p>שאלות? <a href="mailto:support@getprepared.academy" className="underline">support@getprepared.academy</a></p>
      </div>
    </div>
  );
}
