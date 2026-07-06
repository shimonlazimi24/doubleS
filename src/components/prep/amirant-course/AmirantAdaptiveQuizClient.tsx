"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import {
  AMIRANT_BANK_QUESTIONS,
  AMIRANT_PREPARATION_COURSE_ID,
  amirantExamQuestionPromptForDisplay,
  bankQuestionsToPoolItems,
  buildAdaptiveQuizQuestionIds,
  buildNextBestActionAfterQuiz,
  filterBankByTopicsAndVocabMode,
  getBankQuestion,
  getCourseProgressMeta,
  getFirstIncompleteLesson,
  initialInTestLevel,
  loadAmirantProgressState,
  loadAnalytics,
  nextStartLevelFromCrossTest,
  saveAnalytics,
  type NextBestActionEnriched,
  type VocabQuizMode,
  updateInTestLevelAfterAnswer,
  writeCrossTestSnapshot,
} from "@/lib/amirant-course";
import { gradeAdaptiveQuizOutcomes } from "@/lib/amirant-course/session/grade-adaptive-quiz-outcomes";
import type { ManifestQuiz } from "@/lib/amirant-course/types/course-manifest";
import { normalizeQuizTopicSlugs, AMIRANT_TOPIC_LABEL_HE } from "@/lib/amirant-course/topic-labels";
import type { TopicRollup } from "@/lib/amirant-course/analytics/types";
import {
  buildAdaptiveDecisionEvent,
  computeStreakState,
} from "@/lib/amirant-course/adaptive-telemetry";
import { PREP_BASE } from "@/lib/prep/constants";
import { AmirantNextBestActionCard } from "@/components/prep/amirant-course/AmirantNextBestActionCard";
import { Card, CardBody, CardTitle, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { QuizPassagePanel } from "./quiz/QuizPassagePanel";
import { useAmirantPersistence } from "./AmirantPersistenceProvider";
import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

type Phase = "active" | "results";

type DemoResultsSummary = {
  correct: number;
  scorePct: number;
  estimatedLevel: DifficultyLevel;
  weakTopicSlugs: string[];
  explanation: string;
};

function topWeakTopics(byTopic: Record<string, TopicRollup>, limit = 3): string[] {
  return Object.entries(byTopic)
    .filter(([, roll]) => roll.total > 0)
    .sort((a, b) => {
      const aPct = a[1].total > 0 ? a[1].correct / a[1].total : 1;
      const bPct = b[1].total > 0 ? b[1].correct / b[1].total : 1;
      if (aPct !== bPct) return aPct - bPct;
      return b[1].total - a[1].total;
    })
    .slice(0, limit)
    .map(([slug]) => slug);
}

function buildPersonalExplanation(params: {
  scorePct: number;
  estimatedLevel: DifficultyLevel;
  weakTopicsCount: number;
}): string {
  const { scorePct, estimatedLevel, weakTopicsCount } = params;
  if (scorePct >= 80) {
    return `הבסיס שלך חזק. רמת הפתיחה המומלצת כרגע היא ${estimatedLevel}, והמיקוד הבא הוא ללטש דיוק וזמן כדי להתקרב לפטור.`;
  }
  if (scorePct >= 60) {
    return `יש בסיס טוב להתקדמות. זיהינו ${weakTopicsCount} נושאים לשיפור, ורמת הלמידה המומלצת כרגע היא ${estimatedLevel}.`;
  }
  return `כדי להתקדם מהר, כדאי להתחיל בחיזוק היסודות בנושאים החלשים. רמת הלמידה המומלצת כרגע היא ${estimatedLevel}.`;
}

const VOCAB_MODE_LABEL_HE: Record<Exclude<VocabQuizMode, "mixed">, string> = {
  verbs: "פעלים",
  nouns: "שמות עצם",
  adjectives: "תוארים",
  adverbs: "תוארי מעוף / מילות קישור",
  phrasal: "ביטויים / Phrasal",
};

export function AmirantAdaptiveQuizClient({
  manifestQuiz,
  vocabMode = "mixed",
}: {
  manifestQuiz: ManifestQuiz;
  vocabMode?: VocabQuizMode;
}) {
  const { service } = useAmirantPersistence();
  const topics = useMemo(() => normalizeQuizTopicSlugs(manifestQuiz.topicSlugs), [manifestQuiz.topicSlugs]);
  const hasVocabTopic = topics.includes("vocabulary");
  const pool = useMemo(
    () => bankQuestionsToPoolItems(filterBankByTopicsAndVocabMode(topics, vocabMode)),
    [topics, vocabMode],
  );
  const bankById = useMemo(() => new Map(AMIRANT_BANK_QUESTIONS.map((q) => [q.id, q])), []);
  const tieBreakSalt = useMemo(() => `${AMIRANT_PREPARATION_COURSE_ID}:${manifestQuiz.id}`, [manifestQuiz.id]);
  const minInTestLevel = manifestQuiz.minInTestLevel;
  const inTestLevelOptions = useMemo(
    () => (minInTestLevel != null ? { minInTestLevel } : undefined),
    [minInTestLevel],
  );

  const [phase, setPhase] = useState<Phase>("active");
  const [startLevel, setStartLevel] = useState<DifficultyLevel>(3);
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    Array.from({ length: manifestQuiz.questionCount }, () => null),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(() => manifestQuiz.timeLimitSec ?? 39 * 60);
  const [resultsSummary, setResultsSummary] = useState<DemoResultsSummary | null>(null);
  const [nextAfterQuiz, setNextAfterQuiz] = useState<NextBestActionEnriched | null>(null);
  const questionEnteredAt = useRef<number>(Date.now());
  const responseTimesRef = useRef<number[]>(Array.from({ length: manifestQuiz.questionCount }, () => 0));
  const questionIdsRef = useRef<string[]>([]);
  const finalizeOnceRef = useRef(false);
  const attemptIdRef = useRef<string | null>(null);
  const telemetryLoggedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const cross = nextStartLevelFromCrossTest();
    if (minInTestLevel != null) {
      setStartLevel(Math.max(minInTestLevel, cross) as DifficultyLevel);
    } else {
      setStartLevel(cross);
    }
  }, [minInTestLevel]);

  useEffect(() => {
    let cancelled = false;
    if (attemptIdRef.current) return;
    void service
      .startQuizAttempt({
        quizId: manifestQuiz.id,
        sourceMode: "production",
        startLevel,
      })
      .then((id) => {
        if (!cancelled) attemptIdRef.current = id;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [manifestQuiz.id, service, startLevel]);

  const questionIds = useMemo(
    () =>
      buildAdaptiveQuizQuestionIds({
        pool,
        bankById,
        topicSlugs: topics,
        questionCount: manifestQuiz.questionCount,
        startLevel,
        answers,
        tieBreakSalt,
        minInTestLevel: minInTestLevel != null ? (minInTestLevel as DifficultyLevel) : undefined,
      }),
    [pool, bankById, topics, manifestQuiz.questionCount, startLevel, answers, tieBreakSalt, minInTestLevel],
  );

  questionIdsRef.current = questionIds;

  const currentId = questionIds[currentIndex];
  const currentQ = currentId ? getBankQuestion(currentId) : undefined;

  useEffect(() => {
    if (!currentQ) return;
    dispatchAmirantQuestionContext({
      questionText: amirantExamQuestionPromptForDisplay(currentQ.prompt),
      topic: currentQ.topicSlug,
      questionType: currentQ.topicSlug,
    });
  }, [currentQ]);

  const levelAtIndex = useMemo(() => {
    const effectiveStart: DifficultyLevel =
      minInTestLevel != null
        ? (Math.max(startLevel, minInTestLevel) as DifficultyLevel)
        : startLevel;
    let state = initialInTestLevel(effectiveStart);
    const levels: DifficultyLevel[] = [];
    for (let i = 0; i < questionIds.length; i++) {
      levels.push(state.currentLevel);
      const aid = questionIds[i];
      const ans = answers[i];
      if (!aid || ans == null) break;
      const row = bankById.get(aid);
      const ok = row ? row.correctOptionId === ans : false;
      state = updateInTestLevelAfterAnswer(state, ok, inTestLevelOptions).state;
    }
    return levels;
  }, [questionIds, answers, startLevel, bankById, minInTestLevel, inTestLevelOptions]);

  useEffect(() => {
    questionEnteredAt.current = Date.now();
  }, [currentIndex, currentId]);

  useEffect(() => {
    if (phase !== "active") return;
    if (timeLeftSec <= 0) return;
    const t = window.setInterval(() => {
      setTimeLeftSec((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase, timeLeftSec]);

  const finalize = useCallback(
    (reason: "manual" | "timeout") => {
      if (finalizeOnceRef.current) return;
      finalizeOnceRef.current = true;
      const now = Date.now();
      const graded = gradeAdaptiveQuizOutcomes({
        questionIds: questionIdsRef.current,
        answers,
        bankById,
        questionCount: manifestQuiz.questionCount,
        startLevel,
        currentIndex,
        reason,
        nowMs: now,
        questionEnteredAtMs: questionEnteredAt.current,
        prevAnalytics: loadAnalytics(),
        sessionLabel: manifestQuiz.title,
        minInTestLevel: minInTestLevel != null ? (minInTestLevel as DifficultyLevel) : undefined,
      });
      saveAnalytics(graded.nextAnalytics);
      const progress = loadAmirantProgressState();
      const simSessions = graded.nextAnalytics.sessions.filter((s) => s.kind === "simulation");
      const quizSessions = graded.nextAnalytics.sessions.filter((s) => s.kind === "quiz");
      setNextAfterQuiz(
        buildNextBestActionAfterQuiz({
          courseBase: COURSE_BASE,
          nextAnalytics: graded.nextAnalytics,
          attemptId: attemptIdRef.current,
          questionCount: manifestQuiz.questionCount,
          correctCount: graded.correct,
          lessonProgressPercent: getCourseProgressMeta(progress).percent,
          submittedSimulationCount: simSessions.length,
          totalQuizAttempts: quizSessions.length,
          firstIncompleteLesson: getFirstIncompleteLesson(progress, COURSE_BASE),
        }),
      );
      writeCrossTestSnapshot({
        lastEndLevel: graded.finalAdaptiveLevel,
        lastScorePct: graded.scorePercent,
        updatedAt: new Date().toISOString(),
      });
      const persistedRows = questionIdsRef.current.flatMap((questionId, i) => {
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
            startLevel,
          }));
        await service.submitQuizAttempt({
          attemptId,
          quizId: manifestQuiz.id,
          scorePct: graded.scorePercent,
          questionCount: manifestQuiz.questionCount,
          correctCount: graded.correct,
          startLevel,
          endLevel: graded.finalAdaptiveLevel,
          answers: persistedRows,
        });
        await service.appendLearningEvent({
          eventType: "quiz_submitted",
          quizAttemptId: attemptId,
          metadata: {
            quizId: manifestQuiz.id,
            scorePct: graded.scorePercent,
            questionCount: manifestQuiz.questionCount,
          },
        });
        await service.upsertCrossTestState({
          lastEndLevel: graded.finalAdaptiveLevel,
          lastScorePct: graded.scorePercent,
        });
        await service.upsertAdaptiveState({
          topic: "global",
          currentLevel: graded.finalAdaptiveLevel,
          correctStreak: 0,
          wrongStreak: 0,
          recentAccuracy: graded.scorePercent / 100,
          lastQuestionId: questionIdsRef.current[manifestQuiz.questionCount - 1],
        });
        await Promise.all(
          Object.entries(graded.nextAnalytics.byTopic).map(([topic, roll]) =>
            service.upsertTopicRollup({
              topic,
              totalAnswered: roll.total,
              totalCorrect: roll.correct,
              avgResponseMs:
                roll.responseTimeSamples && roll.responseTimeSamples > 0 && roll.responseTimeMsSum != null
                  ? Math.round(roll.responseTimeMsSum / roll.responseTimeSamples)
                  : undefined,
              byDifficulty: roll.byDifficulty,
            }),
          ),
        );
      };
      void persist().catch(() => {});
      const analyticsSnapshot = graded.nextAnalytics;
      const weakFromAnalytics = topWeakTopics(analyticsSnapshot.byTopic, 3);
      const weakTopicSlugs = weakFromAnalytics.length > 0 ? weakFromAnalytics : topics.slice(0, 3);
      setResultsSummary({
        correct: graded.correct,
        scorePct: graded.scorePercent,
        estimatedLevel: graded.finalAdaptiveLevel,
        weakTopicSlugs,
        explanation: buildPersonalExplanation({
          scorePct: graded.scorePercent,
          estimatedLevel: graded.finalAdaptiveLevel,
          weakTopicsCount: weakTopicSlugs.length,
        }),
      });
      setPhase("results");
    },
    [
      answers,
      bankById,
      currentIndex,
      manifestQuiz.id,
      manifestQuiz.questionCount,
      manifestQuiz.title,
      service,
      startLevel,
      topics,
      minInTestLevel,
    ],
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
      for (let j = i + 1; j < next.length; j++) next[j] = null;
      return next;
    });
  }, []);

  const currentLevelLabel = levelAtIndex[currentIndex] ?? startLevel;

  useEffect(() => {
    const qid = questionIds[currentIndex];
    const q = qid ? bankById.get(qid) : undefined;
    if (!qid || !q) return;
    const prevLevel = currentIndex > 0 ? levelAtIndex[currentIndex - 1] ?? startLevel : startLevel;
    const sessionId = attemptIdRef.current ?? undefined;
    const telemetryKey = `${sessionId ?? "local"}:${currentIndex}:${qid}`;
    if (telemetryLoggedRef.current.has(telemetryKey)) return;

    const answersMap = new Map<string, string | null>(
      questionIds.map((id, idx) => [id, answers[idx] ?? null]),
    );
    const streak = computeStreakState({
      questionIds,
      answersByQuestionId: answersMap,
      bankById,
      upToIndexExclusive: currentIndex,
    });
    const event = buildAdaptiveDecisionEvent({
      topic: q.topicSlug,
      previousLevel: prevLevel,
      selectedLevel: q.difficulty,
      reason: `adaptive_quiz_question_selection;index=${currentIndex}`,
      streak: { correct: streak.correct, wrong: streak.wrong },
      recentAccuracy: streak.recentAccuracy,
      questionId: q.id,
      sessionId,
    });
    telemetryLoggedRef.current.add(telemetryKey);
    void service.recordAdaptiveDecision(event).catch(() => {});
  }, [
    answers,
    bankById,
    currentIndex,
    levelAtIndex,
    questionIds,
    service,
    startLevel,
  ]);

  if (phase === "results") {
    const fallbackIds = buildAdaptiveQuizQuestionIds({
      pool,
      bankById,
      topicSlugs: topics,
      questionCount: manifestQuiz.questionCount,
      startLevel,
      answers,
      tieBreakSalt,
    });
    let fallbackCorrect = 0;
    for (let i = 0; i < manifestQuiz.questionCount; i++) {
      const row = fallbackIds[i] ? bankById.get(fallbackIds[i]!) : undefined;
      const ans = answers[i];
      if (row && ans != null && ans === row.correctOptionId) fallbackCorrect += 1;
    }
    const fallbackPct = Math.round((fallbackCorrect / manifestQuiz.questionCount) * 100);
    const fallbackWeak = topics.slice(0, 3);
    const summary: DemoResultsSummary = resultsSummary ?? {
      correct: fallbackCorrect,
      scorePct: fallbackPct,
      estimatedLevel: startLevel,
      weakTopicSlugs: fallbackWeak,
      explanation: buildPersonalExplanation({
        scorePct: fallbackPct,
        estimatedLevel: startLevel,
        weakTopicsCount: fallbackWeak.length,
      }),
    };
    const weakTopicsLine =
      summary.weakTopicSlugs.length > 0
        ? summary.weakTopicSlugs.slice(0, 3).map((slug) => AMIRANT_TOPIC_LABEL_HE[slug as keyof typeof AMIRANT_TOPIC_LABEL_HE] ?? slug)
        : ["עדיין אין מספיק נתונים"];

    return (
      <div className="space-y-6">
        <Text as="h1" variant="titlePage">
          {manifestQuiz.title} — תוצאות
        </Text>
        {nextAfterQuiz ? (
          <AmirantNextBestActionCard action={nextAfterQuiz} className="border-primary/20" />
        ) : null}
        <Card className="mt-6 border-primary/25">
          <CardBody className="space-y-5 p-6">
            <Text as="p" variant="body">
              ציון:{" "}
              <span className="text-xl font-extrabold tabular-nums text-score">
                {summary.correct}/{manifestQuiz.questionCount}
              </span>{" "}
              ({summary.scorePct}%)
            </Text>
            <Text as="p" variant="body">
              רמה משוערת: {summary.estimatedLevel}
            </Text>
            <div className="space-y-2">
              <Text as="p" variant="labelAccent" className="text-primary">
                נושאים חלשים לזיהוי ראשוני
              </Text>
              <ul className="list-disc space-y-1 pr-5 text-sm text-ink">
                {weakTopicsLine.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
            <Text as="p" variant="bodySm" className="text-muted">
              {summary.explanation}
            </Text>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/prep/pricing"
                className="inline-flex rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-card"
              >
                קבל תוכנית אישית
              </Link>
              <Link
                href={`${COURSE_BASE}/analytics`}
                className="inline-flex rounded-control border border-line px-5 py-2.5 text-sm font-semibold text-primary"
              >
                אנליטיקה
              </Link>
              <Link href={COURSE_BASE} className="inline-flex rounded-control border border-line px-5 py-2.5 text-sm font-semibold text-primary">
                חזרה לקורס
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs font-medium text-muted">
        <Link href={COURSE_BASE} className="hover:text-primary">
          הכנה לאמירנט
        </Link>
        <span className="mx-2 text-line">/</span>
        <span className="text-ink">מבחן</span>
      </nav>
      <Text as="h1" variant="titlePage" className="mt-4">
        {manifestQuiz.title}
      </Text>
      <Text as="p" variant="bodySm" className="mt-2 text-muted">
        {manifestQuiz.questionCount} שאלות · רמת פתיחה {startLevel} · נושאים: {topics.map((t) => AMIRANT_TOPIC_LABEL_HE[t]).join(" · ")}
      </Text>
      {hasVocabTopic ? (
        <Text as="p" variant="bodySm" className="mt-1.5 text-ink/90 [direction:rtl] [text-align:start]">
          <span className="text-muted">אוצר מילים במבחן: </span>
          {vocabMode === "mixed" ? (
            <span>מעורב — כל סוגי המילים (ברירת מחדל)</span>
          ) : (
            <span className="font-semibold text-primary">מסונן ל{` ${VOCAB_MODE_LABEL_HE[vocabMode]}`} בלבד (שאלות אחרות, אם יש, ללא שינוי)</span>
          )}
        </Text>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-surface border border-line/80 bg-surface-low px-4 py-3">
        <Text as="p" variant="labelAccent" className="text-primary">
          שאלה {currentIndex + 1} מתוך {manifestQuiz.questionCount} · רמה נוכחית {currentLevelLabel}
        </Text>
        <span className="font-mono text-lg font-bold text-ink">{formatClock(timeLeftSec)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: manifestQuiz.questionCount }, (_, i) => (
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
        <Card className="mt-6 p-6">
          <Text as="p" variant="body">
            לא ניתן לטעון שאלה מהבנק — בדקו את מסנני הנושא.
          </Text>
        </Card>
      )}

      {currentQ && (
        <Card className="mt-6 overflow-hidden">
          <CardTitle className="border-b border-line/60 bg-surface-low px-6 py-3 text-sm">
            {AMIRANT_TOPIC_LABEL_HE[currentQ.topicSlug]} · קושי {currentQ.difficulty}
          </CardTitle>
          <CardBody className="space-y-6 p-6">
            <QuizPassagePanel passageId={currentQ.passageId} />
            <p className="text-base font-medium leading-relaxed text-ink">
              {amirantExamQuestionPromptForDisplay(currentQ.prompt)}
            </p>
            <ul className="space-y-2">
              {currentQ.options.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => setAnswerForIndex(currentIndex, opt.id)}
                    className={cn(
                      "w-full rounded-control border px-4 py-3 text-right text-sm transition",
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
                disabled={answers[currentIndex] == null || currentIndex >= manifestQuiz.questionCount - 1}
                onClick={() => setCurrentIndex((i) => Math.min(manifestQuiz.questionCount - 1, i + 1))}
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
      )}
    </div>
  );
}
