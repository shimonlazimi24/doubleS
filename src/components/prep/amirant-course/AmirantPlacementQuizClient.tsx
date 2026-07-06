"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import {
  AMIRANT_GENERAL_BANK_QUESTIONS,
  amirantExamQuestionPromptForDisplay,
  buildPlacementQuizForm,
  getBankQuestion,
  getPassage,
  loadAnalytics,
  placementNormalizedScore,
  recentPlacementExclusions,
  rememberPlacementForm,
  saveAnalytics,
  writeCrossTestSnapshot,
} from "@/lib/amirant-course";
import { gradeAdaptiveQuizOutcomes } from "@/lib/amirant-course/session/grade-adaptive-quiz-outcomes";
import type { ManifestQuiz } from "@/lib/amirant-course/types/course-manifest";
import { PREP_BASE } from "@/lib/prep/constants";
import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import { Card, CardBody, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { useAmirantPersistence } from "./AmirantPersistenceProvider";
import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

type Phase = "intro" | "active" | "results";

type PlacementResults = {
  correct: number;
  total: number;
  scorePct: number;
  normalizedScore: number;
  estimatedLevel: DifficultyLevel;
};

const SECTION_LABELS = [
  { from: 0, to: 7, label: "השלמת משפטים" },
  { from: 8, to: 11, label: "ניסוח מחדש" },
  { from: 12, to: 14, label: "הבנת הנקרא" },
] as const;

function sectionLabelForIndex(i: number): string {
  return SECTION_LABELS.find((s) => i >= s.from && i <= s.to)?.label ?? "";
}

export function AmirantPlacementQuizClient({ manifestQuiz }: { manifestQuiz: ManifestQuiz }) {
  const { service } = useAmirantPersistence();
  const questionCount = manifestQuiz.questionCount;

  const [phase, setPhase] = useState<Phase>("intro");
  const [form, setForm] = useState<{ questionIds: string[]; passageId: string | null } | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(() => manifestQuiz.timeLimitSec ?? 20 * 60);
  const [results, setResults] = useState<PlacementResults | null>(null);
  const questionEnteredAt = useRef<number>(Date.now());
  const responseTimesRef = useRef<number[]>([]);
  const finalizeOnceRef = useRef(false);
  const attemptIdRef = useRef<string | null>(null);

  /** התחלת המבחן: בונים טופס, פותחים attempt, ומתחילים את הטיימר — רק בלחיצה. */
  const startTest = useCallback(() => {
    const exclusions = recentPlacementExclusions();
    const built = buildPlacementQuizForm({
      // הבנק הכללי — בלי שאלות הסימולציות, כדי לא "לשרוף" אותן לפני שיעורי הסימולציה
      bank: AMIRANT_GENERAL_BANK_QUESTIONS,
      seed: `placement:${Date.now()}:${Math.random()}`,
      excludeQuestionIds: exclusions.questionIds,
      excludePassageIds: exclusions.passageIds,
    });
    rememberPlacementForm(built);
    setForm(built);
    // גודל מערכי המצב נגזר מהטופס שנבנה בפועל — לא מהמניפסט, כדי שטופס קצר
    // (מאגר מדולדל) לא ישאיר משבצות שלעולם אי אפשר לענות עליהן ולסיים.
    setAnswers(Array.from({ length: built.questionIds.length }, () => null));
    responseTimesRef.current = Array.from({ length: built.questionIds.length }, () => 0);
    setPhase("active");
    questionEnteredAt.current = Date.now();
    void service
      .startQuizAttempt({ quizId: manifestQuiz.id, sourceMode: "production", startLevel: 3 })
      .then((id) => {
        attemptIdRef.current = id;
      })
      .catch(() => {});
  }, [manifestQuiz.id, service]);

  const questionIds = form?.questionIds ?? [];
  const effectiveCount = questionIds.length || questionCount;
  const currentId = questionIds[currentIndex];
  const currentQ = currentId ? getBankQuestion(currentId) : undefined;
  const passage = form?.passageId ? getPassage(form.passageId) : undefined;
  const isReadingSection = currentQ?.topicSlug === "reading_comprehension";

  useEffect(() => {
    if (!currentQ) return;
    dispatchAmirantQuestionContext({
      questionText: amirantExamQuestionPromptForDisplay(currentQ.prompt),
      topic: currentQ.topicSlug,
      questionType: currentQ.topicSlug,
    });
  }, [currentQ]);

  useEffect(() => {
    questionEnteredAt.current = Date.now();
  }, [currentIndex, currentId]);

  useEffect(() => {
    if (phase !== "active") return;
    const t = window.setInterval(() => {
      setTimeLeftSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const finalize = useCallback(
    (reason: "manual" | "timeout") => {
      if (finalizeOnceRef.current || !form) return;
      finalizeOnceRef.current = true;
      const formCount = form.questionIds.length;
      const bankById = new Map(
        form.questionIds
          .map((id) => getBankQuestion(id))
          .filter((q): q is NonNullable<typeof q> => !!q)
          .map((q) => [q.id, q]),
      );
      const graded = gradeAdaptiveQuizOutcomes({
        questionIds: form.questionIds,
        answers,
        bankById,
        questionCount: formCount,
        startLevel: 3,
        currentIndex,
        reason,
        nowMs: Date.now(),
        questionEnteredAtMs: questionEnteredAt.current,
        prevAnalytics: loadAnalytics(),
        sessionLabel: manifestQuiz.title,
      });
      saveAnalytics(graded.nextAnalytics);
      writeCrossTestSnapshot({
        lastEndLevel: graded.finalAdaptiveLevel,
        lastScorePct: graded.scorePercent,
        updatedAt: new Date().toISOString(),
      });
      const persistedRows = form.questionIds.flatMap((questionId, i) => {
        const q = bankById.get(questionId);
        if (!q) return [];
        const selected = answers[i] ?? null;
        return [
          {
            questionId: q.id,
            topic: q.topicSlug,
            subtopic: q.subtopicSlug,
            difficulty: q.difficulty,
            selectedOptionId: selected,
            correctOptionId: q.correctOptionId,
            isCorrect: selected === q.correctOptionId,
            responseTimeMs: responseTimesRef.current[i] || undefined,
          },
        ];
      });
      const currentAttemptId = attemptIdRef.current;
      const persist = async () => {
        const attemptId =
          currentAttemptId ??
          (await service.startQuizAttempt({
            quizId: manifestQuiz.id,
            sourceMode: "production",
            startLevel: 3,
          }));
        await service.submitQuizAttempt({
          attemptId,
          quizId: manifestQuiz.id,
          scorePct: graded.scorePercent,
          questionCount: formCount,
          correctCount: graded.correct,
          startLevel: 3,
          endLevel: graded.finalAdaptiveLevel,
          answers: persistedRows,
        });
        await service.appendLearningEvent({
          eventType: "quiz_submitted",
          quizAttemptId: attemptId,
          metadata: {
            quizId: manifestQuiz.id,
            scorePct: graded.scorePercent,
            questionCount: formCount,
            format: "fixed_placement",
          },
        });
        await service.upsertCrossTestState({
          lastEndLevel: graded.finalAdaptiveLevel,
          lastScorePct: graded.scorePercent,
        });
      };
      void persist().catch(() => {});
      setResults({
        correct: graded.correct,
        total: formCount,
        scorePct: graded.scorePercent,
        normalizedScore: placementNormalizedScore(graded.scorePercent),
        estimatedLevel: graded.finalAdaptiveLevel,
      });
      setPhase("results");
    },
    [answers, currentIndex, form, manifestQuiz.id, manifestQuiz.title, service],
  );

  useEffect(() => {
    if (phase !== "active") return;
    if (timeLeftSec > 0) return;
    finalize("timeout");
  }, [phase, timeLeftSec, finalize]);

  const setAnswerForIndex = useCallback((i: number, optionId: string) => {
    if (!responseTimesRef.current[i]) {
      responseTimesRef.current[i] = Math.max(1, Date.now() - questionEnteredAt.current);
    }
    setAnswers((prev) => {
      const next = [...prev];
      next[i] = optionId;
      return next;
    });
  }, []);

  // ── מסך פתיחה ──────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6" dir="rtl">
        <nav className="text-xs font-medium text-muted">
          <Link href={COURSE_BASE} className="hover:text-primary">
            תוכנית הקורס
          </Link>
          <span className="mx-2 text-line">/</span>
          <span className="text-ink">מבחן רמה</span>
        </nav>
        <Text as="h1" variant="titlePage">
          מבחן רמה
        </Text>
        <Card>
          <CardBody className="space-y-5 p-6 sm:p-8">
            <Text as="p" variant="body" className="leading-relaxed">
              מבחן קצר שממפה את רמת האנגלית הנוכחית שלך וקובע נקודת פתיחה מותאמת אישית לקורס.
              בסיום מקבלים ציון משוער בסולם 50–150 — כמו במבחן האמיתי.
            </Text>
            <div className="rounded-2xl border border-line/70 bg-surface-low p-5">
              <Text as="p" variant="labelAccent" className="text-primary">
                מבנה המבחן
              </Text>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">8</span>
                  שאלות השלמת משפטים
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
                  שאלות ניסוח מחדש
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                  שאלות הבנת הנקרא — על קטע קריאה אחד
                </li>
              </ul>
            </div>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>⏱️ משך המבחן: {Math.round((manifestQuiz.timeLimitSec ?? 1200) / 60)} דקות — הטיימר מתחיל רק אחרי הלחיצה על הכפתור.</li>
              <li>🔁 אפשר לנווט בין שאלות ולשנות תשובות עד סיום המבחן.</li>
              <li>🎯 אין ציון עובר — המטרה היא למפות את נקודת הפתיחה שלך.</li>
            </ul>
            <button
              type="button"
              onClick={startTest}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-bold text-white shadow-card transition hover:opacity-90 sm:w-auto"
            >
              התחל מבחן
            </button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── תוצאות ─────────────────────────────────────────────────────────────────
  if (phase === "results" && results) {
    return (
      <div className="mx-auto max-w-2xl space-y-6" dir="rtl">
        <Text as="h1" variant="titlePage">
          מבחן רמה — תוצאות
        </Text>
        <Card className="border-primary/25">
          <CardBody className="space-y-6 p-6 sm:p-8">
            {/* רגע הציון — זהב (חתימת "אקדמי מחודד") */}
            <div className="rounded-2xl bg-surface-low px-6 py-8 text-center">
              <Text as="p" variant="labelAccent" className="text-muted">
                ציון משוער בסולם 50–150
              </Text>
              <p className="mt-2 text-6xl font-extrabold tabular-nums text-score">{results.normalizedScore}</p>
              <Text as="p" variant="bodySm" className="mt-2 text-muted">
                נרמול פשוט מהאחוז — אינדיקציה בלבד, לא ציון רשמי
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line/70 p-4 text-center">
                <p className="text-2xl font-bold text-ink">
                  {results.correct}/{results.total}
                </p>
                <p className="mt-1 text-xs text-muted">תשובות נכונות ({results.scorePct}%)</p>
              </div>
              <div className="rounded-xl border border-line/70 p-4 text-center">
                <p className="text-2xl font-bold text-ink">{results.estimatedLevel}</p>
                <p className="mt-1 text-xs text-muted">רמת לימוד מומלצת (1–6)</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`${COURSE_BASE}/lesson/lesson.intro.personal-roadmap`}
                className="inline-flex rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-card"
              >
                למפת דרכים אישית ←
              </Link>
              <Link
                href="/prep/pricing"
                className="inline-flex rounded-control border border-line px-5 py-2.5 text-sm font-semibold text-primary"
              >
                קבל תוכנית אישית
              </Link>
              <Link
                href={COURSE_BASE}
                className="inline-flex rounded-control border border-line px-5 py-2.5 text-sm font-semibold text-primary"
              >
                חזרה לקורס
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ── מבחן פעיל ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5" dir="rtl">
      <Text as="h1" variant="titlePage">
        מבחן רמה
      </Text>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-surface border border-line/80 bg-surface-low px-4 py-3">
        <div>
          <Text as="p" variant="labelAccent" className="text-primary">
            שאלה {currentIndex + 1} מתוך {effectiveCount}
          </Text>
          <p className="mt-0.5 text-xs text-muted">{sectionLabelForIndex(currentIndex)}</p>
        </div>
        <span
          className={cn(
            "font-mono text-3xl font-bold tabular-nums",
            timeLeftSec <= 60 ? "text-red-600" : timeLeftSec <= 5 * 60 ? "text-amber-600" : "text-ink",
          )}
          aria-label="זמן שנותר"
        >
          {formatClock(timeLeftSec)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: effectiveCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              currentIndex === i ? "bg-primary text-white" : "bg-paper text-muted ring-1 ring-line",
            )}
          >
            {i + 1}
            {answers[i] ? " ✓" : ""}
          </button>
        ))}
      </div>

      {!currentQ && (
        <Card className="p-6">
          <Text as="p" variant="body">
            לא ניתן לטעון שאלה מהבנק.
          </Text>
        </Card>
      )}

      {currentQ && (
        <div className={cn("gap-5", isReadingSection && passage ? "grid grid-cols-1 lg:grid-cols-2" : "")}>
          {isReadingSection && passage ? (
            <Card className="order-1 max-h-[70vh] overflow-y-auto lg:sticky lg:top-24" dir="ltr">
              <CardBody className="p-5">
                {passage.title ? (
                  <p className="mb-3 text-base font-semibold text-ink">{passage.title}</p>
                ) : null}
                <PremiumMarkdownBody body={passage.bodyMarkdown} variant="card" className="[direction:ltr] [&_*]:!text-start" />
              </CardBody>
            </Card>
          ) : null}
          <Card className="order-2 overflow-hidden">
            <CardBody className="space-y-6 p-6">
              <p className="text-base font-medium leading-relaxed text-ink" dir="ltr">
                {amirantExamQuestionPromptForDisplay(currentQ.prompt)}
              </p>
              <ul className="space-y-2">
                {currentQ.options.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => setAnswerForIndex(currentIndex, opt.id)}
                      dir="ltr"
                      className={cn(
                        "w-full rounded-control border px-4 py-3 text-start text-sm transition",
                        answers[currentIndex] === opt.id
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "border-line/80 bg-paper hover:border-primary/40",
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={currentIndex <= 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="rounded-control border border-line bg-paper px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
                >
                  הקודם
                </button>
                <button
                  type="button"
                  disabled={answers[currentIndex] == null || currentIndex >= effectiveCount - 1}
                  onClick={() => setCurrentIndex((i) => Math.min(effectiveCount - 1, i + 1))}
                  className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  הבא
                </button>
                <button
                  type="button"
                  onClick={() => finalize("manual")}
                  disabled={answers.some((a) => a == null)}
                  className="rounded-control border-2 border-primary bg-paper px-4 py-2 text-sm font-semibold text-primary disabled:opacity-40"
                >
                  סיום מבחן
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
