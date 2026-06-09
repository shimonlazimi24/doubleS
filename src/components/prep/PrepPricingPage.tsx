"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui";

const COURSE = `${PREP_BASE}/amirant/course`;

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function FreeBanner({ afterPayPath }: { afterPayPath: string | null }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">גישה פתוחה</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">הקורס פתוח חינם כרגע</h2>
        <Text as="p" variant="body" className="mt-2 text-muted">
          כל המודולים, מבחנים אדפטיביים, סימולציות ועוזר AI — זמינים לגמרי ללא תשלום.
        </Text>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-muted">
          <li>מודול מבוא + אבחון</li>
          <li>שלוש מיומנויות ליבה + סימולציות</li>
          <li>דשבורד אישי ומעקב התקדמות</li>
        </ul>
        <div className="mt-6">
          <Link
            href={afterPayPath ?? COURSE}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-[#0f1e3d] px-6 text-sm font-bold text-white shadow-cta transition hover:bg-[#16306a]"
          >
            התחל ללמוד עכשיו ←
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PrepPricingPage() {
  const searchParams = useSearchParams();
  const lockedModule = searchParams.get("module");
  const checkoutState = searchParams.get("checkout");
  const afterPayPath = safeNextPath(searchParams.get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (getPrepHasFullAccess()) {
    return <FreeBanner afterPayPath={afterPayPath} />;
  }

  async function startCheckout() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/prep/checkout", { method: "POST" });
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

  return (
    <div className="space-y-8">
      {checkoutState === "cancel" ? (
        <p className="rounded-xl border border-line/80 bg-canvas px-4 py-3 text-sm text-muted">
          התשלום בוטל. אפשר לנסות שוב בכל עת.
        </p>
      ) : null}
      {afterPayPath ? (
        <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-ink">
          אחרי רכישה מוצלחת תועברו למסלול הלמידה. מודול המבוא זמין לעיון גם לפני רכישה.
        </p>
      ) : null}
      {lockedModule ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          המודול «{lockedModule}» זמין בגישה מלאה. מודול המבוא נשאר פתוח לעיון.
        </p>
      ) : null}

      <div className="rounded-2xl border border-line/80 bg-paper p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Amirant Preparation — גישה מלאה</h2>
        <Text as="p" variant="body" className="mt-2 text-muted">
          כל המודולים, מבחנים אדפטיביים, סימולציות, עוזר AI מלווה ודשבורד אישי.
        </Text>
        <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-muted">
          <li>מודול מבוא + אבחון (חינם לעיון)</li>
          <li>שלוש מיומנויות ליבה + סימולציות</li>
          <li>סנכרון התקדמות בין מכשירים</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="primary" className="min-h-11" disabled={busy} onClick={() => void startCheckout()}>
            {busy ? "פותח תשלום…" : "רכישה מאובטחת"}
          </Button>
          <Link
            href={`${PREP_BASE}/login?next=${encodeURIComponent(`${PREP_BASE}/pricing${afterPayPath ? `?next=${encodeURIComponent(afterPayPath)}` : ""}`)}`}
            className="inline-flex min-h-11 items-center rounded-control border border-line px-4 text-sm font-medium text-primary"
          >
            התחברות לפני רכישה
          </Link>
          <Link href={COURSE} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-primary">
            חזרה לקורס
          </Link>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
