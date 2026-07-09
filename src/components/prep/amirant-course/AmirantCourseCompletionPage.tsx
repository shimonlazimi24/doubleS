"use client";

import { useState } from "react";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE = `${PREP_BASE}/amirant/course`;
const PROMO_CODE = "AMIRANT2026";

type ContactState = "idle" | "sending" | "done" | "error";

function CelebrationHeader() {
  return (
    <div className="border-b border-[#1b3366]/20 bg-gradient-to-br from-[#0f1e3d] via-[#1a3260] to-[#0d1a35] px-6 py-14 text-center text-white">
      <div className="mx-auto max-w-xl space-y-4">
        <span className="text-5xl">🏆</span>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
          סיימת את הקורס!
        </h1>
        <p className="text-base text-white/75">
          השקעת את הזמן, עשית את העבודה. עכשיו אתה מוכן למבחן.
        </p>
        <div className="flex flex-wrap justify-center gap-6 pt-2">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-[#d4a843]">78</p>
            <p className="text-xs text-white/60">שיעורים</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-[#d4a843]">100%</p>
            <p className="text-xs text-white/60">הושלם</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-[#d4a843]">✓</p>
            <p className="text-xs text-white/60">מוכן למבחן</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoSection() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-[#d4a843]/40 bg-gradient-to-br from-[#fffbee] to-[#fff9e0] p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">מתנה ממנו</p>
      <h2 className="mt-2 font-display text-xl font-bold text-[#0f1e3d]">
        קוד הנחה לקורס הבא
      </h2>
      <p className="mt-1.5 text-sm text-[#5a6480]">
        15% הנחה על כל קורס עתידי באתר - לשימוש אישי בלבד
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <code className="rounded-xl border border-[#d4a843]/50 bg-white px-6 py-3 font-mono text-xl font-bold tracking-widest text-[#0f1e3d] shadow-sm">
          {PROMO_CODE}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-xl border border-[#d4a843]/50 bg-[#d4a843] px-4 py-3 text-sm font-bold text-[#0f1e3d] transition hover:bg-[#e7bb59]"
        >
          {copied ? "הועתק ✓" : "העתק"}
        </button>
      </div>
      <p className="mt-3 text-xs text-[#94a3b8]">תקף ל-30 יום</p>
    </div>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<ContactState>("idle");

  const valid = form.name.trim().length > 0 && form.email.includes("@");

  const submit = async () => {
    if (!valid) return;
    setStatus("sending");
    try {
      await fetch("/api/prep/completion-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          course: "amirant-preparation",
        }),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 font-semibold text-emerald-800">נקלטת בהצלחה!</p>
        <p className="mt-1 text-sm text-emerald-700">
          ניצור איתך קשר עם עדכונים, הנחות וקורסים חדשים.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d6deec] bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">
        נשארים בקשר
      </p>
      <h2 className="mt-2 font-display text-xl font-bold text-[#0f1e3d]">
        קבל עדכונים וקורסים חדשים
      </h2>
      <p className="mt-1.5 text-sm text-[#5a6480]">
        נעדכן אותך על TOEFL, קורסים חדשים ומבצעים - בלי ספאם.
      </p>

      <div className="mt-5 space-y-3">
        <input
          type="text"
          placeholder="שם מלא"
          dir="rtl"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-xl border border-[#d6deec] bg-white px-4 py-3 text-right text-sm text-[#0f1e3d] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0f1e3d] focus:ring-2 focus:ring-[#0f1e3d]/10"
        />
        <input
          type="email"
          placeholder="כתובת מייל"
          dir="ltr"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-xl border border-[#d6deec] bg-white px-4 py-3 text-left text-sm text-[#0f1e3d] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0f1e3d] focus:ring-2 focus:ring-[#0f1e3d]/10"
        />
        <input
          type="tel"
          placeholder="טלפון (אופציונלי)"
          dir="ltr"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full rounded-xl border border-[#d6deec] bg-white px-4 py-3 text-left text-sm text-[#0f1e3d] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0f1e3d] focus:ring-2 focus:ring-[#0f1e3d]/10"
        />
        <button
          type="button"
          disabled={!valid || status === "sending"}
          onClick={() => void submit()}
          className="w-full rounded-xl bg-[#0f1e3d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#16306a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "שולח..." : "הישארו מעודכנים ←"}
        </button>
        {status === "error" && (
          <p className="text-center text-sm text-red-600">משהו השתבש - נסה שוב.</p>
        )}
      </div>
    </div>
  );
}

function NextSteps() {
  return (
    <div className="rounded-2xl border border-[#d6deec] bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">
        מה הלאה
      </p>
      <h2 className="mt-2 font-display text-xl font-bold text-[#0f1e3d]">
        לקראת יום הבחינה
      </h2>
      <div className="mt-5 space-y-3">
        {[
          { icon: "◈", text: "חזור על נושאים חלשים בדשבורד האישי" },
          { icon: "▣", text: "הרץ סימולציה נוספת תחת תנאי לחץ" },
          { icon: "✦", text: "קרא שוב את תחומי החולשה שה-AI זיהה" },
          { icon: "◎", text: "קח הפסקה - אתה מוכן" },
        ].map((item) => (
          <div key={item.text} className="flex items-start gap-3">
            <span className="mt-0.5 text-lg text-[#b88a2f]">{item.icon}</span>
            <p className="text-sm text-[#2c3550]">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`${COURSE}/dashboard`}
          className="rounded-xl bg-[#0f1e3d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#16306a]"
        >
          לדשבורד האישי ←
        </Link>
        <Link
          href={COURSE}
          className="rounded-xl border border-[#d6deec] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1e3d] transition hover:bg-[#f8faff]"
        >
          חזרה לתוכנית הקורס
        </Link>
      </div>
    </div>
  );
}

export function AmirantCourseCompletionPage() {
  return (
    <div dir="rtl" className="bg-[#fbf8f1] pb-20">
      <CelebrationHeader />
      <div className="mx-auto max-w-2xl space-y-6 px-4 pt-8">
        <PromoSection />
        <ContactSection />
        <NextSteps />
      </div>
    </div>
  );
}
