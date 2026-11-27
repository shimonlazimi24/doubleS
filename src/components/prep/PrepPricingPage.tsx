"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readUtmParams, trackEvent } from "@/lib/prep/analytics";
import { PREP_BASE } from "@/lib/prep/constants";
import { EXTENSION_GRACE_DAYS, PLAN_DAYS, PLAN_PRICES_NIS, extensionDeadline, isExtensionWindowOpen } from "@/lib/prep/pricing-plans";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";

export type PlanId = "week" | "two_weeks" | "month";

const SHARED_FEATURES = [
  "כל המודולים + 6 סימולציות מלאות",
  "תרגול לפי הרמה שלכם",
  "עוזר AI בגישה המלאה",
  "דשבורד התקדמות אישי",
];

/**
 * מחירים וימים מגיעים מ-pricing-plans.ts - אותו מקור שה-checkout מחייב לפיו.
 * כאן רק קופי שיווקי (תוויות, פיצ'רים) - כדי שעדכון מחיר לא יציג
 * מחיר אחד ויחייב אחר.
 */
export const PLANS: {
  id: PlanId;
  label: string;
  duration: string;
  price: number;
  features: string[];
}[] = [
  { id: "week", label: "שבוע", duration: `${PLAN_DAYS.week} ימים`, price: PLAN_PRICES_NIS.week!, features: SHARED_FEATURES },
  {
    id: "two_weeks",
    label: "שבועיים",
    duration: `${PLAN_DAYS.two_weeks} ימים`,
    price: PLAN_PRICES_NIS.two_weeks!,
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

// שמות עבריים ל-slugs של מודולים - שלא יופיע «sentence-completion» למשתמש
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
  const nextAfterPay = searchParams.get("next");

  // A signed-out visitor who picked a plan comes back from login with it in the URL.
  const planFromUrl = PLANS.find((p) => p.id === searchParams.get("plan"))?.id;
  const [selected, setSelected] = useState<PlanId>(planFromUrl ?? "two_weeks");
  // Extensions are sold only to learners who already bought a plan, until
  // EXTENSION_GRACE_DAYS after their access ends. null = not offered.
  const [extensionUntil, setExtensionUntil] = useState<Date | "open" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = createPrepSupabaseBrowserClient();
    if (!client) return;
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await client
        .from("course_entitlements")
        .select("ends_at")
        .eq("user_id", user.id)
        .eq("access_type", "paid")
        .limit(1);
      const endsAt = (data?.[0]?.ends_at as string | null | undefined) ?? null;
      if (cancelled || !data || data.length === 0 || !isExtensionWindowOpen(endsAt)) return;
      setExtensionUntil(extensionDeadline(endsAt) ?? "open");
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("view_pricing", {});
    // Remember intended destination for post-checkout (Hyp callback → success page).
    if (nextAfterPay && nextAfterPay.startsWith("/") && !/^\/[\/\\]|[\\\x00-\x1f]/.test(nextAfterPay)) {
      try {
        sessionStorage.setItem("prep_checkout_next", nextAfterPay);
      } catch {
        /* ignore */
      }
    }
  }, [nextAfterPay]);

  // Back from the payment page: the browser may restore this page from its
  // back/forward cache with the button still busy.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setBusy(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  function selectPlan(planId: PlanId) {
    setSelected(planId);
    trackEvent("select_plan", { plan: planId });
  }

  async function startCheckout(planId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/prep/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, utm: readUtmParams() ?? undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.status === 401) {
        // Signed-out visitor (the pricing page is public): sign in, then come back here.
        const backParams = new URLSearchParams(window.location.search);
        if (PLANS.some((p) => p.id === planId)) backParams.set("plan", planId);
        const query = backParams.toString();
        const back = `${window.location.pathname}${query ? `?${query}` : ""}`;
        window.location.href = `${PREP_BASE}/login?next=${encodeURIComponent(back)}`;
        return;
      }
      if (!res.ok || !data.url) {
        trackEvent("checkout_failed", { plan: planId, stage: "create" });
        setError(data.error ?? "לא ניתן לפתוח תשלום. התחברו קודם או פנו לתמיכה.");
        setBusy(false);
        return;
      }
      // Counted only once a payment page really exists. The button stays busy
      // while the browser leaves for Hyp, so a second tap cannot open another order.
      trackEvent("begin_checkout", { plan: planId });
      window.location.href = data.url;
    } catch {
      trackEvent("checkout_failed", { plan: planId, stage: "network" });
      setError("שגיאת רשת. נסו שוב.");
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
              aria-pressed={isSelected}
              className={`relative rounded border p-5 text-right transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-primary hover:border-primary/40"
              }`}
            >
              <p className={`text-sm ${isSelected ? "text-white/75" : "text-muted"}`}>
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

      {/* כלול בתוכנית - רשימה שטוחה, בלי קופסה מקוננת */}
      <div className="border-t border-line pt-6">
        <p className="text-sm font-semibold text-ink">מה כלול ב{currentPlan.label}</p>
        <ul className="mt-3 grid list-disc gap-2 ps-5 marker:text-muted sm:grid-cols-2">
          {currentPlan.features.map((f) => (
            <li key={f} className="text-sm text-ink">
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* פעולה ראשית יחידה */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => void startCheckout(selected)}
          className="inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-control bg-primary px-8 text-base font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? "מעביר לתשלום…" : `רכישה - ₪${currentPlan.price} ל${currentPlan.label}`}
        </button>
        <p className="text-xs text-muted-2">תשלום מאובטח ב-Hyp · גישה לזמן מוגבל לפי התוכנית</p>
        {error && (
          <p className="mt-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Access extension: a flat row, shown only to learners who already bought a plan */}
      {extensionUntil ? (
        <div className="border-t border-line pt-6">
          <p className="text-sm font-semibold text-ink">הארכת גישה, בלי לאבד התקדמות</p>
          <p className="mt-1 text-xs text-muted">
            {extensionUntil === "open"
              ? `המחיר המוזל זמין עד ${EXTENSION_GRACE_DAYS} יום מסיום הגישה.`
              : `המחיר המוזל זמין עד ${extensionUntil.toLocaleDateString("he-IL", { day: "numeric", month: "numeric", year: "numeric" })} (${EXTENSION_GRACE_DAYS} יום מסיום הגישה). אחרי זה רק תוכנית רגילה.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXTENSION_PLANS.map((ext) => (
              <button
                key={ext.id}
                type="button"
                disabled={busy}
                onClick={() => void startCheckout(ext.id)}
                className="rounded-lg border border-line bg-surface-low px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary/40 hover:bg-white disabled:opacity-50"
              >
                {ext.label} - ₪{ext.price}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Fine print */}
      <div className="space-y-1 pt-2 text-center text-xs text-muted-2">
        <p>הגישה ניתנת מיד לאחר אישור התשלום · מחירים בשקלים · אין הבטחת ציון או פטור</p>
        <p>
          <a href={`${PREP_BASE}/terms`} className="underline">
            תקנון שימוש
          </a>
          {" · "}
          שאלות?{" "}
          <a href="mailto:support@getprepared.academy" className="underline">
            support@getprepared.academy
          </a>
        </p>
      </div>
    </div>
  );
}
