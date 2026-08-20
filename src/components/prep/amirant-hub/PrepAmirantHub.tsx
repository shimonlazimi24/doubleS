"use client";

import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";

const COURSE = `${PREP_BASE}/amirant/course`;

const SCORE_LANES = [
  { range: "134–150", label: "פטור מלא", detail: "0 קורסי השלמה", width: "92%", color: "bg-emerald-600" },
  { range: "120–133", label: "מתקדמים ב׳", detail: "קורס אחד", width: "74%", color: "bg-sky-600" },
  { range: "100–119", label: "מתקדמים א׳", detail: "2 קורסים", width: "56%", color: "bg-amber-500" },
  { range: "85–99", label: "בסיסי", detail: "3–4 קורסים", width: "36%", color: "bg-rose-600" },
] as const;

const HOW_STEPS = [
  { n: "01", title: "מבחן רמה", body: "מבחן פתיחה קצר - מיפוי רמה, מהירות ונושאים חלשים." },
  { n: "02", title: "תרגול ממוקד", body: "יחידות אדפטיביות שמתאימות לרמה ומחזקות בדיוק איפה שצריך." },
  { n: "03", title: "סימולציה מלאה", body: "מבחן בטיימר, דוח אישי, ולחץ זמן - תרגול בסגנון יום הבחינה." },
] as const;

const FEATURES = [
  { title: "למידה אדפטיבית", body: "רמת קושי משתנה בזמן אמת לפי ביצועים, לא לפי מסלול גנרי." },
  { title: "ליווי AI", body: "משוב ממוקד אחרי בוחן (בגישה מלאה) - מה לחזק עכשיו ומה לדחות." },
  { title: "זיהוי חולשות", body: "בוחנים מותאמים לנקודות החלשות שלך במקום תרגול מיותר." },
  { title: "סימולציות מלאות", body: "תרחיש מבחן עם לחץ זמן וניהול קצב, על בנק שאלות של הקורס." },
] as const;

export function PrepAmirantHub() {
  return (
    <div dir="rtl" className="bg-canvas">

      {/* ── Hero - שפת הנייר של האתר (בלי גרדיאנט כהה+זהב) ── */}
      <section className="border-b border-line bg-paper px-4 py-14 md:py-20">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <span className="inline-flex items-center rounded-full border border-accent/25 bg-accent-muted px-4 py-1.5 text-xs font-semibold tracking-wide text-accent">
            מעודכן לרפורמת 2026
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-primary md:text-[3.25rem]">
            הכנה לאמירנט -
            <br className="hidden sm:block" />
            כדי להגיע לפטור בלי קורסי השלמה מיותרים
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            שיעורים, תרגול אדפטיבי, סימולציות מלאות וליווי AI. הציון הרשמי נקבע רק במבחן מאל״ו —
            אנחנו מכינים אתכם אליו.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`${COURSE}/quiz/quiz-entry-diagnostic`}
              className="inline-flex items-center justify-center rounded-control bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-cta transition hover:bg-primary-hover"
            >
              מבחן רמה חינם
            </Link>
            <Link
              href={AMIRANT_CONTINUE_PATH}
              className="inline-flex items-center justify-center rounded-control border border-line bg-paper px-6 py-3.5 text-sm font-semibold text-primary transition hover:border-primary/35"
            >
              התחל במבוא החינמי
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 pt-2 text-xs text-muted">
            <span>✓ ללא כרטיס אשראי</span>
            <span>✓ 15 שאלות בסגנון המבחן</span>
            <span>✓ הערכת רמה משוערת — לא ציון רשמי</span>
          </div>
        </div>
      </section>

      {/* ── Score urgency ── */}
      <section className="border-b border-line bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">מפת ציונים</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              כמה ציון שווה בפועל
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              כל מדרגה = פחות קורסי אנגלית, פחות כסף, פחות עיכוב בתואר.
            </p>
          </div>
          <div className="space-y-4">
            {SCORE_LANES.map((lane) => (
              <div key={lane.range} className="flex items-center gap-4">
                <div className="w-20 shrink-0 text-right font-mono text-sm font-bold text-primary">
                  {lane.range}
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">{lane.label}</span>
                    <span className="text-muted">{lane.detail}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-high">
                    <div
                      className={`h-3 rounded-full ${lane.color}`}
                      style={{ width: lane.width }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-line pt-4 text-center text-sm font-semibold text-primary">
            הציון שלך נקבע לפי מהירות, דיוק ואסטרטגיה - לא רק ידע. אפשר לשפר.
          </p>
        </div>
      </section>

      {/* ── Diagnostic (one path only) ── */}
      <section id="demo" className="scroll-mt-20 border-b border-line px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">מבחן רמה</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
            בדיקת רמה אחת, 15 שאלות
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            8 השלמת משפטים, 4 ניסוח מחדש, 3 הבנת הנקרא. בסוף מקבלים הערכת רמה משוערת (מיפוי מאחוז —
            לא ציון אמירנט רשמי) ומפת דרכים.
          </p>
          <Link
            href={`${COURSE}/quiz/quiz-entry-diagnostic`}
            className="mt-6 inline-flex items-center justify-center rounded-control bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-cta transition hover:bg-primary-hover"
          >
            התחלת מבחן הרמה
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b border-line bg-white px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">3 שלבים</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              איך המסלול עובד
            </h2>
          </div>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
            {HOW_STEPS.map((step) => (
              <div key={step.n} className="border-t-2 border-primary/15 pt-4">
                <p className="font-mono text-sm font-bold text-score">{step.n}</p>
                <p className="mt-2 font-semibold text-primary">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b border-line px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">יכולות</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary md:text-3xl">
              מה מייחד את הקורס
            </h2>
          </div>
          <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-t border-line pt-4">
                <p className="font-semibold text-primary">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* עדויות הוסרו: היו פיקטיביות (שמות וציונים מומצאים) - סיכון אמון/צרכנות.
          יוחזרו כשיהיו עדויות אמיתיות מתלמידים משלמים. */}

      {/* ── Final CTA - כנה: מבוא+מבחן רמה חינם, הקורס המלא בתשלום ── */}
      <section className="border-t border-line bg-paper px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent">מוכנים להתחיל?</p>
          <h2 className="font-display text-3xl font-bold leading-tight text-primary md:text-4xl">
            התחילו במבחן רמה חינם
          </h2>
          <p className="mx-auto max-w-lg text-base text-muted">
            מודול המבוא ומבחן הרמה פתוחים לכולם. הקורס המלא - בגישה משבוע עד חודש, לפי הקצב שלכם.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`${COURSE}/quiz/quiz-entry-diagnostic`}
              className="inline-flex items-center justify-center rounded-control bg-primary px-8 py-4 text-base font-bold text-white shadow-cta transition hover:bg-primary-hover"
            >
              מבחן רמה חינם
            </Link>
            <Link
              href={`${PREP_BASE}/pricing`}
              className="inline-flex items-center justify-center rounded-control border border-line bg-paper px-6 py-4 text-sm font-semibold text-primary transition hover:border-primary/35"
            >
              לצפייה במחירים
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
