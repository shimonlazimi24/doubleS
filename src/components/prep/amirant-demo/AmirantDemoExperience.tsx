"use client";

import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink, Card, Container, Text } from "@/components/ui";
import { AmirantDemoChat } from "@/components/prep/amirant-demo/AmirantDemoChat";
import { AmirantPracticeFlow } from "@/components/prep/amirant-demo/AmirantPracticeFlow";
import { cn } from "@/lib/design-system/cn";
import { PREP_BASE } from "@/lib/prep/constants";
import {
  AMIRANT_DEMO_COURSE_NAME,
  mockAiAnalysis,
  mockBehaviorReport,
  mockDashboardStats,
  mockIntegrations,
  mockProgressSeries,
  mockVideoMeta,
} from "@/lib/prep/amirant-demo/mock-data";

const fontHeebo = Heebo({
  subsets: ["latin", "hebrew"],
  display: "swap",
  variable: "--font-amirant-heebo",
});
const fontFrank = Frank_Ruhl_Libre({
  subsets: ["latin", "hebrew"],
  display: "swap",
  variable: "--font-amirant-frank",
  weight: ["400", "700", "900"],
});

const NAV = [
  { id: "demo-dashboard", label: "דשבורד" },
  { id: "demo-video", label: "ווידאו אינטראקטיבי" },
  { id: "demo-quiz", label: "מבחן דמה (10)" },
  { id: "demo-ai", label: "ניתוח AI" },
  { id: "demo-reports", label: "דוחות" },
  { id: "demo-adaptive", label: "מבחן מערכת" },
  { id: "demo-integrations", label: "אינטגרציות" },
  { id: "demo-chat", label: "עוזר למידה" },
] as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function AmirantDemoFullExperience() {
  const [videoSec, setVideoSec] = useState(0);
  const [videoInteractionSolved, setVideoInteractionSolved] = useState(false);
  const [videoChoice, setVideoChoice] = useState<number | null>(null);

  const showVideoOverlay =
    videoSec >= mockVideoMeta.interaction.atSec && !videoInteractionSolved;

  return (
    <div
      className={cn(
        fontHeebo.className,
        fontHeebo.variable,
        fontFrank.variable,
        "min-h-screen bg-[#faf8f3] text-[#1a1a2e]",
      )}
    >
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-[#0f1e3d] shadow-md">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-6 py-3.5">
          <Link
            href={PREP_BASE}
            className="font-serif text-[1.25rem] font-bold text-[#d4a843] no-underline"
            style={{ fontFamily: "var(--font-amirant-frank), serif" }}
          >
            אמירנט
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${PREP_BASE}/amirant`}
              className="rounded-md bg-[#d4a843] px-4 py-2 text-sm font-bold text-[#0f1e3d] no-underline transition hover:bg-[#f0c96a]"
            >
              שער אמירנט
            </Link>
          </div>
        </div>
      </header>

      <section
        id="amirant-demo-hero"
        className="relative overflow-hidden bg-gradient-to-br from-[#0f1e3d] from-0% via-[#1a3260] via-60% to-[#2a4a8a] px-6 py-12 text-center text-white md:py-16"
      >
        <p className="mb-4 inline-block rounded-full border border-[#d4a843]/50 bg-[#d4a843]/20 px-4 py-1.5 text-xs font-semibold text-[#f0c96a] md:text-[13px]">
          מדריך-דמו · אפריל 2026 · ללא שמירת נתונים
        </p>
        <h1
          className="mx-auto max-w-[52rem] text-3xl font-black leading-tight md:text-5xl"
          style={{ fontFamily: "var(--font-amirant-frank), serif" }}
        >
          <span className="text-white">הכנה ל</span>{" "}
          <span className="text-[#d4a843]">אמירנט 2026</span>
          <span className="block text-white sm:inline"> - חוויית מוצר</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[36rem] text-base text-white/75 md:text-lg">
          {AMIRANT_DEMO_COURSE_NAME} - בוחן הדמה למטה: 10 שאלות, רמות 3–5, מנוע אמיתי כמו ב־SQL.
        </p>
      </section>

      <div className="border-b border-[#e2ddd5] bg-white">
        <Container className="py-6">
          <Text as="p" variant="bodySm" className="text-[#5a6480]">
            דשבורד, וידאו, AI ודוחות: מוק · מבחן הדמה ומבחן המערכת המלא: אותו בנק שאלות, ולוגיקה אמיתית - ללא שרת.
          </Text>
          <nav
            aria-label="מקטעי הדמו"
            className="mt-5 flex gap-2 overflow-x-auto rounded-xl border border-[#e2ddd5] bg-[#faf8f3] p-2 [scrollbar-width:thin]"
          >
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-[#5a6480] transition hover:bg-white hover:text-[#0f1e3d]"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </Container>
      </div>

      {/* דשבורד */}
      <section id="demo-dashboard" className="scroll-mt-32 border-t border-line/60 bg-paper py-section">
        <Container>
          <Text as="h2" variant="headline" className="mb-8">
            דשבורד לומד (דמו)
          </Text>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockDashboardStats.map((s) => (
              <Card key={s.label} className="p-6">
                <Text as="p" variant="caption" className="text-primary">
                  {s.label}
                </Text>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{s.value}</p>
                <Text as="p" variant="bodySm" className="mt-2">
                  {s.hint}
                </Text>
              </Card>
            ))}
          </div>
          <div className="mt-10 max-w-readable">
            <Text as="h3" variant="headlineSm" className="mb-4">
              מגמת ציונים (דמו)
            </Text>
            <div className="flex h-40 items-end gap-3">
              {mockProgressSeries.map((p) => (
                <div key={p.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[3rem] rounded-t-sm bg-primary/85 transition hover:bg-primary"
                    style={{ height: `${Math.round((p.score / 100) * 120)}px` }}
                    title={`${p.score}%`}
                  />
                  <span className="text-xs font-medium text-muted">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* וידאו */}
      <section id="demo-video" className="scroll-mt-32 border-t border-line/60 bg-surface-low py-section">
        <Container>
          <Text as="h2" variant="headline" className="mb-2">
            שיעור וידאו + אינטראקציה (מוק)
          </Text>
          <Text as="p" variant="body" className="mb-8 max-w-readable">
            גררו את הזמן מעל ~{Math.floor(mockVideoMeta.interaction.atSec / 60)}:{String(mockVideoMeta.interaction.atSec % 60).padStart(2, "0")} כדי להפעיל שאלת ביניים - כמו נגן עם נקודות עצירה.
          </Text>

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="overflow-hidden rounded-surface bg-ink shadow-card ring-1 ring-line/50">
              <div className="aspect-video bg-gradient-to-br from-primary/30 via-surface-high to-ink flex items-center justify-center">
                <span className="rounded-full bg-paper/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
                  תצוגת וידאו מדומה · {mockVideoMeta.title}
                </span>
              </div>
              <div className="space-y-4 bg-paper p-4">
                <label className="block text-sm font-semibold text-ink">
                  זמן בווידאו: {Math.floor(videoSec / 60)}:{String(videoSec % 60).padStart(2, "0")} /{" "}
                  {mockVideoMeta.durationLabel}
                </label>
                <input
                  type="range"
                  min={0}
                  max={mockVideoMeta.durationSec}
                  value={videoSec}
                  onChange={(e) => setVideoSec(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                {showVideoOverlay && (
                  <div className="rounded-surface border-2 border-primary/40 bg-primary/5 p-4">
                    <Text as="p" variant="labelAccent" className="mb-2">
                      אינטראקציה בזמן צפייה
                    </Text>
                    <p className="text-sm font-medium text-ink">{mockVideoMeta.interaction.question}</p>
                    <ul className="mt-3 space-y-2">
                      {mockVideoMeta.interaction.options.map((opt, i) => (
                        <li key={opt}>
                          <button
                            type="button"
                            onClick={() => setVideoChoice(i)}
                            className={cn(
                              "w-full rounded-control border px-3 py-2 text-start text-sm transition",
                              videoChoice === i
                                ? "border-primary bg-primary/10 font-semibold text-primary"
                                : "border-line bg-paper hover:border-primary/40",
                            )}
                          >
                            {opt}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={videoChoice === null}
                      onClick={() => {
                        if (videoChoice === mockVideoMeta.interaction.correctIndex) {
                          setVideoInteractionSolved(true);
                        }
                      }}
                      className="mt-4 rounded-control bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                    >
                      שליחה (דמו)
                    </button>
                    {videoInteractionSolved && (
                      <p className="mt-3 text-sm font-semibold text-sage">נכון - ממשיכים (דמו).</p>
                    )}
                    {videoChoice !== null &&
                      videoChoice !== mockVideoMeta.interaction.correctIndex &&
                      !videoInteractionSolved && (
                        <p className="mt-3 text-sm text-muted">לא בדיוק - נסו אפשרות אחרת (דמו).</p>
                      )}
                  </div>
                )}
              </div>
            </div>
            <aside className="rounded-surface border border-line/80 bg-paper p-4 shadow-card">
              <Text as="h3" variant="title" className="mb-3">
                פרקים
              </Text>
              <ul className="space-y-2 text-sm text-muted">
                {mockVideoMeta.chapters.map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      className="w-full text-start underline-offset-2 hover:text-primary hover:underline"
                      onClick={() => setVideoSec(c.startSec)}
                    >
                      {Math.floor(c.startSec / 60)}:{String(c.startSec % 60).padStart(2, "0")} · {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </section>

      {/* מבחן דמו - 10 שאלות, מנוע אמת */}
      <section
        id="demo-quiz"
        className="scroll-mt-28 border-t border-[#e2ddd5] bg-[#faf8f3] py-12 md:py-section"
      >
        <Container>
          <h2
            className="mb-2 inline-block border-b-2 border-[#d4a843] pb-2 text-2xl font-bold text-[#0f1e3d] md:text-3xl"
            style={{ fontFamily: "var(--font-amirant-frank), serif" }}
          >
            בוחן דמה - 10 שאלות
          </h2>
          <p className="mb-2 max-w-[52rem] text-sm text-[#5a6480]">
            בינוני־מתקדם (רמות 3–5) · מעורב: השלמת משפטים, ניסוח מחדש, הבנת הנקרא · בנק כמו ב־amirant-demo
          </p>
          <AmirantPracticeFlow embedded shortQuizOnly />
        </Container>
      </section>

      {/* AI */}
      <section id="demo-ai" className="scroll-mt-32 border-t border-line/60 bg-surface-low py-section">
        <Container>
          <Text as="h2" variant="headline" className="mb-2">
            ניתוח AI מובנה (דמו)
          </Text>
          <Text as="p" variant="bodySm" className="mb-6 text-muted">
            {mockAiAnalysis.modelLabel} · {mockAiAnalysis.generatedAt.slice(0, 10)}
          </Text>
          <Card className="max-w-readable p-8">
            <Text as="p" variant="bodyLg" className="text-ink">
              {mockAiAnalysis.summary}
            </Text>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <Text as="h3" variant="title" className="mb-2 text-sage">
                  חוזקות
                </Text>
                <ul className="list-inside list-disc text-sm text-muted">
                  {mockAiAnalysis.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Text as="h3" variant="title" className="mb-2 text-primary">
                  פערים
                </Text>
                <ul className="list-inside list-disc text-sm text-muted">
                  {mockAiAnalysis.gaps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-line/80 pt-6">
              <Text as="h3" variant="title" className="mb-2">
                צעדים הבאים (מוצעים)
              </Text>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted">
                {mockAiAnalysis.nextSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </Card>
        </Container>
      </section>

      {/* דוחות */}
      <section id="demo-reports" className="scroll-mt-32 border-t border-line/60 bg-paper py-section">
        <Container>
          <Text as="h2" variant="headline" className="mb-2">
            דוח התנהגות והתקדמות (דמו)
          </Text>
          <Text as="p" variant="body" className="mb-8 max-w-readable">
            שכבת Analytics אוגרת אירועים; כאן טבלת דמה למעקב מדריך.
          </Text>
          <div className="overflow-x-auto rounded-surface border border-line/80 shadow-card">
            <table className="w-full min-w-[520px] text-start text-sm">
              <thead className="bg-surface-low text-ink">
                <tr>
                  <th className="px-4 py-3 font-semibold">אירוע</th>
                  <th className="px-4 py-3 font-semibold">ספירה</th>
                  <th className="px-4 py-3 font-semibold">ממוצע דק׳ (אם רלוונטי)</th>
                </tr>
              </thead>
              <tbody>
                {mockBehaviorReport.rows.map((row) => (
                  <tr key={row.event} className="border-t border-line/60">
                    <td className="px-4 py-3 text-muted">{row.event}</td>
                    <td className="px-4 py-3 font-medium">{row.count}</td>
                    <td className="px-4 py-3 text-muted">
                      {row.avgMinutes !== null ? row.avgMinutes : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* בוחן אדפטיבי - מנוע אמת (לא מוק) */}
      <section id="demo-adaptive" className="scroll-mt-28 border-t border-[#e2ddd5] bg-white py-12 md:py-section">
        <Container>
          <Text
            as="h2"
            variant="headline"
            className="mb-2 text-[#0f1e3d]"
            style={{ fontFamily: "var(--font-amirant-frank), serif" }}
          >
            מבחן מערכת (סימולציה מלאה)
          </Text>
          <Text as="p" variant="body" className="mb-8 max-w-readable text-[#5a6480]">
            אותו בנק שאלות - כאן: מבנה קורס, תרגול קצר 10 או{" "}
            <strong className="font-semibold text-[#0f1e3d]">סימולציה מלאה</strong> (פיילוט + 4 פרקי ציון).{" "}
            <code className="rounded bg-[#faf8f3] px-1 py-0.5 text-xs ring-1 ring-[#e2ddd5]">amirant-demo.sql</code>
          </Text>
          <AmirantPracticeFlow embedded />
        </Container>
      </section>

      {/* אינטגרציות */}
      <section id="demo-integrations" className="scroll-mt-32 border-t border-line/60 bg-surface-low py-section">
        <Container>
          <Text as="h2" variant="headline" className="mb-8">
            אינטגרציות (תצוגת דמה)
          </Text>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockIntegrations.map((i) => (
              <Card key={i.name} className="p-5">
                <Text as="p" variant="title" className="text-ink">
                  {i.name}
                </Text>
                <Text as="p" variant="caption" className="mt-1 text-sage">
                  {i.status}
                </Text>
                <Text as="p" variant="bodySm" className="mt-2">
                  {i.detail}
                </Text>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* צ׳אט */}
      <section id="demo-chat" className="scroll-mt-32 border-t border-line/60 bg-gradient-to-b from-paper to-canvas/30 py-section md:pb-24">
        <Container>
          <Text as="h2" variant="headline" className="mb-2">
            צ׳אט עם עוזר הלמידה
          </Text>
          <Text as="p" variant="body" className="mb-8 max-w-readable">
            ממשק בסגנון אפליקציות צ׳אט מודרניות - בועות, אווטארים, אינדיקטור הקלדה ושליחה בכפתור עגול. בפרודקשן: RAG
            מהחומר שלכם + מודל.
          </Text>
          <AmirantDemoChat />
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href={PREP_BASE} variant="secondary">
              חזרה לדף הבית
            </ButtonLink>
            <ButtonLink href={`${PREP_BASE}/amirant`} variant="ghost">
              עמוד אמירנט
            </ButtonLink>
          </div>
        </Container>
      </section>
    </div>
  );
}

function AmirantDemoExperienceInner() {
  const searchParams = useSearchParams();
  if (searchParams.get("panel") === "adaptive") {
    return <AmirantPracticeFlow />;
  }
  return <AmirantDemoFullExperience />;
}

export function AmirantDemoExperience() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] bg-canvas py-16 text-center text-sm text-muted" aria-busy="true">
          טוען…
        </div>
      }
    >
      <AmirantDemoExperienceInner />
    </Suspense>
  );
}
