"use client";

import { useState } from "react";
import Link from "next/link";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE = `${PREP_BASE}/amirant/course`;

type ContactState = "idle" | "sending" | "done" | "error";

/* קוד ההנחה הוסר: אין מנגנון קופונים בסליקה - הבטחה לא מגובה. */

function CelebrationHeader() {
  const totalLessons = AMIRANT_PREPARATION_MANIFEST.modules.flatMap((m) => m.lessons).length;
  return (
    <div className="border-b border-line bg-paper px-6 py-14 text-center">
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-score">סוף הקורס</p>
        <h1 className="font-display text-3xl font-bold leading-tight text-primary md:text-4xl">
          סיימתם את הקורס
        </h1>
        <p className="text-base text-muted">
          השקעתם את הזמן ועשיתם את העבודה. מכאן ממשיכים לחיזוק אחרון לפני יום הבחינה.
        </p>
        <div className="mx-auto flex max-w-sm justify-center divide-x divide-x-reverse divide-line pt-3">
          <div className="px-6 text-center">
            <p className="font-display text-2xl font-bold text-score">{totalLessons}</p>
            <p className="text-xs text-muted">שיעורים</p>
          </div>
          <div className="px-6 text-center">
            <p className="font-display text-2xl font-bold text-score">100%</p>
            <p className="text-xs text-muted">מהתוכנית</p>
          </div>
        </div>
      </div>
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
      const res = await fetch("/api/prep/completion-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          course: "amirant-preparation",
        }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <section className="border-t border-line pt-6 text-center">
        <p className="font-semibold text-ink">נרשמתם לעדכונים</p>
        <p className="mt-1 text-sm text-muted">
          נצור קשר כשיעלו קורסים חדשים או עדכונים חשובים למבחן.
        </p>
      </section>
    );
  }

  const inputClass =
    "w-full rounded-control border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-display text-xl font-bold text-primary">רוצים לשמוע על הקורס הבא?</h2>
      <p className="mt-1.5 text-sm text-muted">
        נעדכן על קורסים חדשים ושינויים במבחן. בלי ספאם, אפשר לבטל בכל רגע.
      </p>
      <div className="mt-5 max-w-md space-y-3">
        <input
          type="text"
          placeholder="שם מלא"
          dir="rtl"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={`${inputClass} text-right`}
        />
        <input
          type="email"
          placeholder="כתובת מייל"
          dir="ltr"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={`${inputClass} text-left`}
        />
        <input
          type="tel"
          placeholder="טלפון (אופציונלי)"
          dir="ltr"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={`${inputClass} text-left`}
        />
        <button
          type="button"
          disabled={!valid || status === "sending"}
          onClick={() => void submit()}
          className="min-h-11 w-full rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "שולח…" : "עדכנו אותי"}
        </button>
        {status === "error" && (
          <p className="text-center text-sm text-pen">משהו השתבש - נסו שוב בעוד רגע.</p>
        )}
      </div>
    </section>
  );
}

function NextSteps() {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-primary">לקראת יום הבחינה</h2>
      <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink">
        <li>חזרו על הנושאים החלשים דרך ההתקדמות האישית.</li>
        <li>הריצו סימולציה נוספת בתנאי זמן אמיתיים.</li>
        <li>קראו שוב את ההמלצות האישיות של העוזר.</li>
        <li>ערב לפני המבחן - הפסקה. אתם מוכנים.</li>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`${COURSE}/analytics`}
          className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          להתקדמות האישית ←
        </Link>
        <Link
          href={COURSE}
          className="inline-flex min-h-11 items-center rounded-control border border-line bg-paper px-5 text-sm font-semibold text-primary transition hover:border-primary/35"
        >
          חזרה לתוכנית הקורס
        </Link>
      </div>
    </section>
  );
}

export function AmirantCourseCompletionPage() {
  return (
    <div dir="rtl" className="bg-canvas pb-20">
      <CelebrationHeader />
      <div className="mx-auto max-w-2xl space-y-8 px-4 pt-10">
        <NextSteps />
        <ContactSection />
      </div>
    </div>
  );
}
