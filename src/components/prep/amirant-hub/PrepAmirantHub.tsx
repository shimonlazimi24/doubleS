"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE = `${PREP_BASE}/amirant/course`;

const SCORE_LANES = [
  { range: "134–150", label: "פטור מלא", detail: "0 קורסי השלמה", width: "92%", color: "bg-emerald-600" },
  { range: "120–133", label: "מתקדמים ב׳", detail: "קורס אחד", width: "74%", color: "bg-sky-600" },
  { range: "100–119", label: "מתקדמים א׳", detail: "2 קורסים", width: "56%", color: "bg-amber-500" },
  { range: "85–99", label: "בסיסי", detail: "3–4 קורסים", width: "36%", color: "bg-rose-600" },
] as const;

const HOW_STEPS = [
  { n: "01", title: "אבחון", body: "מבחן לדוגמה קצר — מיפוי רמה, מהירות ונושאים חלשים." },
  { n: "02", title: "תרגול ממוקד", body: "יחידות אדפטיביות שמתאימות לרמה ומחזקות בדיוק איפה שצריך." },
  { n: "03", title: "סימולציה מלאה", body: "מבחן בזמן אמת, תנאי לחץ, ודוח אישי — כמו ביום הבחינה." },
] as const;

const FEATURES = [
  { icon: "◈", title: "למידה אדפטיבית", body: "רמת קושי משתנה בזמן אמת לפי ביצועים, לא לפי מסלול גנרי." },
  { icon: "✦", title: "AI Coach", body: "משוב ממוקד אחרי כל בוחן — מה מחזק ציון מיידית ומה לדחות." },
  { icon: "◎", title: "זיהוי חולשות", body: "בוחנים מותאמים לנקודות החלשות שלך במקום תרגול מיותר." },
  { icon: "▣", title: "סימולציות אמיתיות", body: "תרחיש מבחן מלא עם לחץ זמן וניהול קצב כמו ביום הבחינה." },
] as const;

const TESTIMONIALS = [
  { name: "נועה ל.", role: "מדעי המחשב", avatar: "נ", quote: "מ-82 ל-118 תוך שישה שבועות. הגעתי לפטור בלי לבזבז שנה." },
  { name: "איתי ש.", role: "הנדסה", avatar: "א", quote: "הסימולציות הכי קרובות למבחן האמיתי. הורידו לחץ ביום הבחינה." },
  { name: "שיר ר.", role: "מדעי החיים", avatar: "ש", quote: "הבנתי בדיוק מה חלש אצלי. הציון עלה 24 נקודות תוך חודש." },
] as const;

const AmirantPracticeFlow = dynamic(
  () =>
    import("@/components/prep/amirant-demo/AmirantPracticeFlow").then((m) => m.AmirantPracticeFlow),
  { ssr: false, loading: () => <p className="py-12 text-center text-sm text-[#5a6480]">טוען מבחן…</p> },
);

export function PrepAmirantHub() {
  return (
    <div dir="rtl" className="bg-[#fbf8f1]">

      {/* ── Hero ── */}
      <section className="border-b border-[#1b3366]/30 bg-gradient-to-br from-[#0f1e3d] via-[#1a3260] to-[#0d1a35] px-4 py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <span className="inline-flex items-center rounded-full border border-[#d4a843]/40 bg-[#d4a843]/12 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#f1d286]">
            מעודכן 2026 · מבוסס נתוני מבחן אמיתיים
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-[3.5rem]">
            פטור מאנגלית —
            <br className="hidden sm:block" />
            בלי קורסי השלמה מיותרים
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/75 md:text-xl">
            מסלול הכנה לאמירנט שמוביל לציון שחוסך אלפי שקלים וחודשים מהתואר. תרגול אדפטיבי, סימולציות מלאות וליווי AI.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-control bg-[#d4a843] px-7 py-3.5 text-sm font-bold text-[#0f1e3d] shadow-cta transition hover:bg-[#e7bb59]"
            >
              נסה מבחן חינם ↓
            </a>
            <Link
              href={COURSE}
              className="inline-flex items-center justify-center rounded-control border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/18"
            >
              כניסה לקורס המלא
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 pt-2 text-xs text-white/50">
            <span>✓ ללא כרטיס אשראי</span>
            <span>✓ כל החומר כלול</span>
            <span>✓ תוצאות מיידיות</span>
          </div>
        </div>
      </section>

      {/* ── Score urgency ── */}
      <section className="border-b border-[#dce4ef] bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">מפת ציונים</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#0f1e3d] md:text-3xl">
              כמה ציון שווה בפועל
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5a6480]">
              כל מדרגה = פחות קורסי אנגלית, פחות כסף, פחות עיכוב בתואר.
            </p>
          </div>
          <div className="space-y-4">
            {SCORE_LANES.map((lane) => (
              <div key={lane.range} className="flex items-center gap-4">
                <div className="w-20 shrink-0 text-right font-mono text-sm font-bold text-[#0f1e3d]">
                  {lane.range}
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0f1e3d]">{lane.label}</span>
                    <span className="text-[#5a6480]">{lane.detail}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#edf0f7]">
                    <div
                      className={`h-3 rounded-full ${lane.color}`}
                      style={{ width: lane.width }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#d4a843]/30 bg-[#fffbee] px-5 py-4 text-center">
            <p className="text-sm font-semibold text-[#0f1e3d]">
              הציון שלך נקבע לפי מהירות, דיוק ואסטרטגיה — לא רק ידע. אפשר לשפר.
            </p>
          </div>
        </div>
      </section>

      {/* ── Demo ── */}
      <section id="demo" className="scroll-mt-20 border-b border-[#dce4ef] px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">מבחן לדוגמה</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#0f1e3d] md:text-3xl">
              בדוק את הרמה שלך עכשיו
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5a6480]">
              10 שאלות, כ-5 דקות. קבל משוב מיידי ותוכנית אישית.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#cdd6e8] bg-white shadow-[0_4px_24px_rgba(15,30,61,0.08)]">
            <Suspense
              fallback={<p className="py-12 text-center text-sm text-[#5a6480]">טוען מבחן…</p>}
            >
              <AmirantPracticeFlow embedded shortQuizOnly />
            </Suspense>
          </div>
          <p className="mt-4 text-center text-xs text-[#5a6480]">
            אחרי המבחן תראה תוצאות, רמה משוערת ונושאים לחיזוק.{" "}
            <Link href={COURSE} className="font-semibold text-[#0f1e3d] hover:underline">
              להמשך לקורס המלא ←
            </Link>
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b border-[#dce4ef] bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">3 שלבים</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#0f1e3d] md:text-3xl">
              איך המסלול עובד
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-xl border border-[#d6deec] bg-[#f8faff] p-6"
              >
                <p className="font-mono text-3xl font-bold text-[#d4a843]">{step.n}</p>
                <p className="mt-3 font-semibold text-[#0f1e3d]">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5a6480]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b border-[#dce4ef] px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">יכולות</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#0f1e3d] md:text-3xl">
              מה מייחד את הקורס
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#d6deec] bg-white p-6"
              >
                <p className="text-2xl text-[#b88a2f]">{f.icon}</p>
                <p className="mt-3 font-semibold text-[#0f1e3d]">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5a6480]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-b border-[#dce4ef] bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">סטודנטים</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#0f1e3d] md:text-3xl">
              תוצאות מהשטח
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between rounded-xl border border-[#d6deec] bg-[#f8faff] p-5"
              >
                <p className="text-sm leading-relaxed text-[#2c3550]">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0f1e3d] text-sm font-bold text-white">
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0f1e3d]">{t.name}</p>
                    <p className="text-xs text-[#5a6480]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-[#0f1e3d] via-[#142a54] to-[#0d1a35] px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f1d286]">
            גישה פתוחה
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            מוכן להתחיל?
            <br />
            הקורס המלא פתוח עכשיו
          </h2>
          <p className="mx-auto max-w-lg text-base text-white/70">
            כל השיעורים, הבוחנים, הסימולציות והדשבורד האישי — ללא תשלום, ללא הגבלה.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={COURSE}
              className="inline-flex items-center justify-center rounded-control bg-[#d4a843] px-8 py-4 text-base font-bold text-[#0f1e3d] shadow-cta transition hover:bg-[#e7bb59]"
            >
              כניסה לקורס המלא ←
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-control border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/18"
            >
              נסה מבחן לדוגמה
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
