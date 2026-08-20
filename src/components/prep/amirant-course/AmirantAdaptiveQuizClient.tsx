"use client";

import Link from "next/link";
import { useQuizTimer } from "./useQuizTimer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import {
  AMIRANT_PREPARATION_COURSE_ID,
  amirantExamQuestionPromptForDisplay,
  buildAdaptiveQuizQuestionIds,
  buildNextBestActionAfterQuiz,
  getCourseProgressMeta,
  getFirstIncompleteLesson,
  initialInTestLevel,
  loadAmirantProgressState,
  loadAnalytics,
  nextStartLevelFromCrossTest,
  recordQuestionOutcome,
  recordSessionEnd,
  saveAnalytics,
  type NextBestActionEnriched,
  type VocabQuizMode,
  updateInTestLevelAfterAnswer,
  writeCrossTestSnapshot,
} from "@/lib/amirant-course";
import type { BankQuestion } from "@/lib/amirant-course/types/bank-question";
import {
  bankQuestionsPublicToPoolItems,
  filterPublicBankByTopicsAndVocabMode,
  getPublicBankQuestion,
} from "@/lib/amirant-course/question-bank/client-bank";
import { gradeBatchAnswers, gradeCheckAnswer } from "@/lib/amirant-course/grade-client";
import type { ManifestQuiz } from "@/lib/amirant-course/types/course-manifest";
import { normalizeQuizTopicSlugs, AMIRANT_TOPIC_LABEL_HE } from "@/lib/amirant-course/topic-labels";
import type { TopicRollup } from "@/lib/amirant-course/analytics/types";
import { buildAdaptiveDecisionEvent } from "@/lib/amirant-course/adaptive-telemetry";
import { PREP_BASE } from "@/lib/prep/constants";
import { AmirantNextBestActionCard } from "@/components/prep/amirant-course/AmirantNextBestActionCard";
import { Card, CardBody, CardTitle, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { QuizOptionContent } from "./quiz/QuizOptionContent";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { QuizPassagePanel } from "./quiz/QuizPassagePanel";
import { getAmirantTopicLinks } from "@/lib/amirant-course/next-best-action";
import { useAmirantPersistence } from "./AmirantPersistenceProvider";
import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";
import { showPrepToast } from "@/lib/prep/show-prep-toast";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;
const EMPTY_BANK_BY_ID = new Map<string, BankQuestion>();

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

function streakFromAnswerCorrect(
  answerCorrect: (boolean | null)[],
  upToIndexExclusive: number,
): { correct: number; wrong: number; recentAccuracy?: number } {
  let attempted = 0;
  let correctTotal = 0;
  let correctStreak = 0;
  let wrongStreak = 0;

  for (let i = 0; i < upToIndexExclusive; i++) {
    const ok = answerCorrect[i];
    if (ok == null) continue;
    attempted += 1;
    if (ok) correctTotal += 1;
  }

  for (let i = upToIndexExclusive - 1; i >= 0; i--) {
    const ok = answerCorrect[i];
    if (ok == null) break;
    if (ok && wrongStreak === 0) {
      correctStreak += 1;
      continue;
    }
    if (!ok && correctStreak === 0) {
      wrongStreak += 1;
      continue;
    }
    break;
  }

  return {
    correct: correctStreak,
    wrong: wrongStreak,
    recentAccuracy: attempted > 0 ? Number((correctTotal / attempted).toFixed(4)) : undefined,
  };
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
    () => bankQuestionsPublicToPoolItems(filterPublicBankByTopicsAndVocabMode(topics, vocabMode)),
    [topics, vocabMode],
  );
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
  const [answerCorrect, setAnswerCorrect] = useState<(boolean | null)[]>(() =>
    Array.from({ length: manifestQuiz.questionCount }, () => null),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(() => manifestQuiz.timeLimitSec ?? 39 * 60);
  const [resultsSummary, setResultsSummary] = useState<DemoResultsSummary | null>(null);
  const [nextAfterQuiz, setNextAfterQuiz] = useState<NextBestActionEnriched | null>(null);
  const [gradingIndex, setGradingIndex] = useState<number | null>(null);
  const questionEnteredAt = useRef<number>(Date.now());
  const responseTimesRef = useRef<number[]>(Array.from({ length: manifestQuiz.questionCount }, () => 0));
  const questionIdsRef = useRef<string[]>([]);
  const finalizeOnceRef = useRef(false);
  const attemptIdRef = useRef<string | null>(null);
  const telemetryLoggedRef = useRef<Set<string>>(new Set());
  const gradeRequestSeqRef = useRef(0);

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
        bankById: EMPTY_BANK_BY_ID,
        topicSlugs: topics,
        questionCount: manifestQuiz.questionCount,
        startLevel,
        answers,
        answerCorrect,
        tieBreakSalt,
        minInTestLevel: minInTestLevel != null ? (minInTestLevel as DifficultyLevel) : undefined,
      }),
    [pool, topics, manifestQuiz.questionCount, startLevel, answers, answerCorrect, tieBreakSalt, minInTestLevel],
  );

  questionIdsRef.current = questionIds;

  const currentId = questionIds[currentIndex];
  const currentQ = currentId ? getPublicBankQuestion(currentId) : undefined;

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
      const ok = answerCorrect[i];
      if (!aid || ans == null || ok == null) break;
      state = updateInTestLevelAfterAnswer(state, ok, inTestLevelOptions).state;
    }
    return levels;
  }, [questionIds, answers, answerCorrect, startLevel, minInTestLevel, inTestLevelOptions]);

  useEffect(() => {
    questionEnteredAt.current = Date.now();
  }, [currentIndex, currentId]);

  useQuizTimer(phase === "active", setTimeLeftSec);

  const finalize = useCallback(
    (reason: "manual" | "timeout") => {
      if (finalizeOnceRef.current) return;
      finalizeOnceRef.current = true;

      const run = async () => {
        const now = Date.now();
        const ids = questionIdsRef.current;
        const batch = await gradeBatchAnswers(
          ids.map((questionId, i) => ({
            questionId,
            selectedOptionId: answers[i] ?? null,
          })),
          true,
        );

        const effectiveStart: DifficultyLevel =
          minInTestLevel != null
            ? (Math.max(startLevel, minInTestLevel) as DifficultyLevel)
            : startLevel;
        const inTestOpt = minInTestLevel != null ? { minInTestLevel } : undefined;
        let state = initialInTestLevel(effectiveStart);
        let nextA = loadAnalytics();
        let correct = 0;

        for (let i = 0; i < manifestQuiz.questionCount; i++) {
          const qid = ids[i];
          if (!qid) continue;
          const row = getPublicBankQuestion(qid);
          if (!row) continue;
          const ans = answers[i];
          const timedBlank = ans == null && reason === "timeout" && i === currentIndex;
          if (ans == null && !timedBlank) continue;

          const item = batch.items.find((x) => x.questionId === qid);
          const isCorrect = item?.isCorrect === true;
          if (isCorrect) correct += 1;

          const timeMs = i === currentIndex ? Math.max(0, now - questionEnteredAt.current) : undefined;
          nextA = recordQuestionOutcome(nextA, {
            topicSlug: row.topicSlug,
            subtopicSlug: row.subtopicSlug,
            difficulty: row.difficulty,
            isCorrect,
            timeMs,
          });
          state = updateInTestLevelAfterAnswer(state, isCorrect, inTestOpt).state;
        }

        const scorePercent =
          manifestQuiz.questionCount > 0 ? Math.round((correct / manifestQuiz.questionCount) * 100) : 0;
        const nextAnalytics = recordSessionEnd(nextA, {
          kind: "quiz",
          label: manifestQuiz.title,
          scorePct: scorePercent,
        });
        const finalAdaptiveLevel = state.currentLevel;

        saveAnalytics(nextAnalytics);
        const progress = loadAmirantProgressState();
        const simSessions = nextAnalytics.sessions.filter((s) => s.kind === "simulation");
        const quizSessions = nextAnalytics.sessions.filter((s) => s.kind === "quiz");
        setNextAfterQuiz(
          buildNextBestActionAfterQuiz({
            courseBase: COURSE_BASE,
            nextAnalytics,
            attemptId: attemptIdRef.current,
            questionCount: manifestQuiz.questionCount,
            correctCount: correct,
            lessonProgressPercent: getCourseProgressMeta(progress).percent,
            submittedSimulationCount: simSessions.length,
            totalQuizAttempts: quizSessions.length,
            firstIncompleteLesson: getFirstIncompleteLesson(progress, COURSE_BASE),
          }),
        );
        writeCrossTestSnapshot({
          lastEndLevel: finalAdaptiveLevel,
          lastScorePct: scorePercent,
          updatedAt: new Date().toISOString(),
        });

        const gradedById = new Map(batch.items.map((item) => [item.questionId, item]));
        const persistedRows = ids.flatMap((questionId, i) => {
          const q = getPublicBankQuestion(questionId);
          if (!q) return [];
          const selected = answers[i] ?? null;
          const graded = gradedById.get(questionId);
          return [
            {
              questionId: q.id,
              topic: q.topicSlug,
              subtopic: q.subtopicSlug,
              difficulty: q.difficulty,
              selectedOptionId: selected,
              correctOptionId: graded?.correctOptionId ?? "",
              isCorrect: graded?.isCorrect === true,
              responseTimeMs: responseTimesRef.current[i] || undefined,
            },
          ];
        });

        const currentAttemptId = attemptIdRef.current;
        try {
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
            scorePct: scorePercent,
            questionCount: manifestQuiz.questionCount,
            correctCount: correct,
            startLevel,
            endLevel: finalAdaptiveLevel,
            answers: persistedRows,
          });
          await service.appendLearningEvent({
            eventType: "quiz_submitted",
            quizAttemptId: attemptId,
            metadata: {
              quizId: manifestQuiz.id,
              scorePct: scorePercent,
              questionCount: manifestQuiz.questionCount,
            },
          });
          await service.upsertCrossTestState({
            lastEndLevel: finalAdaptiveLevel,
            lastScorePct: scorePercent,
          });
          await service.upsertAdaptiveState({
            topic: "global",
            currentLevel: finalAdaptiveLevel,
            correctStreak: 0,
            wrongStreak: 0,
            recentAccuracy: scorePercent / 100,
            lastQuestionId: ids[manifestQuiz.questionCount - 1],
          });
          await Promise.all(
            Object.entries(nextAnalytics.byTopic).map(([topic, roll]) =>
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
        } catch {
          showPrepToast("התוצאה נשמרה במכשיר; הסנכרון לחשבון נכשל — נסו לרענן.", { tone: "error" });
        }

        const weakFromAnalytics = topWeakTopics(nextAnalytics.byTopic, 3);
        const weakTopicSlugs = weakFromAnalytics.length > 0 ? weakFromAnalytics : topics.slice(0, 3);
        setResultsSummary({
          correct,
          scorePct: scorePercent,
          estimatedLevel: finalAdaptiveLevel,
          weakTopicSlugs,
          explanation: buildPersonalExplanation({
            scorePct: scorePercent,
            estimatedLevel: finalAdaptiveLevel,
            weakTopicsCount: weakTopicSlugs.length,
          }),
        });
        setPhase("results");
      };

      void run().catch(() => {
        finalizeOnceRef.current = false;
        showPrepToast("לא הצלחנו לחשב את הציון. נסו שוב.", { tone: "error" });
      });
    },
    [
      answers,
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

  const setAnswerForIndex = useCallback(
    (i: number, optionId: string) => {
      const qid = questionIdsRef.current[i];
      if (!qid) return;
      if (!responseTimesRef.current[i]) {
        responseTimesRef.current[i] = Math.max(1, Date.now() - questionEnteredAt.current);
      }
      const seq = ++gradeRequestSeqRef.current;
      setGradingIndex(i);
      void gradeCheckAnswer(qid, optionId)
        .then((ok) => {
          if (seq !== gradeRequestSeqRef.current) return;
          setAnswers((prev) => {
            const next = [...prev];
            next[i] = optionId;
            for (let j = i + 1; j < next.length; j++) next[j] = null;
            return next;
          });
          setAnswerCorrect((prev) => {
            const next = [...prev];
            next[i] = ok;
            for (let j = i + 1; j < next.length; j++) next[j] = null;
            return next;
          });
        })
        .catch(() => {
          if (seq !== gradeRequestSeqRef.current) return;
          showPrepToast("בדיקת התשובה נכשלה. נסו שוב.", { tone: "error" });
        })
        .finally(() => {
          if (seq === gradeRequestSeqRef.current) setGradingIndex(null);
        });
    },
    [],
  );

  useEffect(() => {
    const qid = questionIds[currentIndex];
    const q = qid ? getPublicBankQuestion(qid) : undefined;
    if (!qid || !q) return;
    const prevLevel = currentIndex > 0 ? levelAtIndex[currentIndex - 1] ?? startLevel : startLevel;
    const sessionId = attemptIdRef.current ?? undefined;
    const telemetryKey = `${sessionId ?? "local"}:${currentIndex}:${qid}`;
    if (telemetryLoggedRef.current.has(telemetryKey)) return;

    const streak = streakFromAnswerCorrect(answerCorrect, currentIndex);
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
  }, [answerCorrect, currentIndex, levelAtIndex, questionIds, service, startLevel]);

  if (phase === "results") {
    const fallbackCorrect = answerCorrect.filter((x) => x === true).length;
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

    const firstWrongTopic = questionIds
      .map((id, i) => (answerCorrect[i] === false ? getPublicBankQuestion(id)?.topicSlug : null))
      .find((slug): slug is NonNullable<typeof slug> => Boolean(slug));
    const mistakeDrillHref = firstWrongTopic
      ? getAmirantTopicLinks(firstWrongTopic, COURSE_BASE).practiceHref
      : null;

    return (
      <div className="space-y-6">
        <Text as="h1" variant="titlePage">
          {manifestQuiz.title} - תוצאות
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
              {mistakeDrillHref ? (
                <Link
                  href={mistakeDrillHref}
                  className="inline-flex rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-card"
                >
                  תרגול ממוקד על הטעויות ←
                </Link>
              ) : null}
              <Link
                href={COURSE_BASE}
                className="inline-flex rounded-control border border-line px-5 py-2.5 text-sm font-semibold text-primary"
              >
                חזרה לקורס
              </Link>
              <Link
                href={`${COURSE_BASE}/analytics`}
                className="inline-flex rounded-control border border-line px-5 py-2.5 text-sm font-semibold text-primary"
              >
                אנליטיקה
              </Link>
            </div>
            <p className="text-xs text-muted">
              רוצים גישה מלאה?{" "}
              <Link href="/prep/pricing" className="font-medium text-primary underline-offset-2 hover:underline">
                למחירים
              </Link>
            </p>
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
        {manifestQuiz.questionCount} שאלות · מותאם לרמה שלך · {topics.map((t) => AMIRANT_TOPIC_LABEL_HE[t]).join(" · ")}
      </Text>
      {hasVocabTopic ? (
        <Text as="p" variant="bodySm" className="mt-1.5 text-ink/90 [direction:rtl] [text-align:start]">
          <span className="text-muted">אוצר מילים במבחן: </span>
          {vocabMode === "mixed" ? (
            <span>מעורב - כל סוגי המילים (ברירת מחדל)</span>
          ) : (
            <span className="font-semibold text-primary">מסונן ל{` ${VOCAB_MODE_LABEL_HE[vocabMode]}`} בלבד (שאלות אחרות, אם יש, ללא שינוי)</span>
          )}
        </Text>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-surface border border-line/80 bg-surface-low px-4 py-3">
        <Text as="p" variant="labelAccent" className="text-primary">
          שאלה {currentIndex + 1} מתוך {manifestQuiz.questionCount} · מותאם לרמה שלך
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
            לא ניתן לטעון שאלה מהבנק - בדקו את מסנני הנושא.
          </Text>
        </Card>
      )}

      {currentQ && (
        <Card className="mt-6 overflow-hidden">
          <CardTitle className="border-b border-line/60 bg-surface-low px-6 py-3 text-sm">
            {AMIRANT_TOPIC_LABEL_HE[currentQ.topicSlug]}
          </CardTitle>
          <CardBody className="space-y-6 p-6">
            <div className={cn(currentQ.passageId && "grid gap-6 lg:grid-cols-2 lg:items-start")}>
              {currentQ.passageId ? (
                <QuizPassagePanel
                  passageId={currentQ.passageId}
                  className="max-h-[min(70vh,32rem)] lg:sticky lg:top-24"
                />
              ) : null}
              <div className="space-y-6">
                <p className="text-base font-medium leading-relaxed text-ink" dir="ltr" style={{ textAlign: "left" }}>
                  {amirantExamQuestionPromptForDisplay(currentQ.prompt)}
                </p>
                <ul className="space-y-2">
                  {currentQ.options.map((opt, optIndex) => (
                    <li key={opt.id}>
                      <button
                        type="button"
                        disabled={gradingIndex === currentIndex}
                        onClick={() => setAnswerForIndex(currentIndex, opt.id)}
                        className={cn(
                          "w-full rounded-control border px-4 py-3 text-start text-sm transition",
                          answers[currentIndex] === opt.id
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-line/80 bg-paper hover:border-primary/40",
                          gradingIndex === currentIndex && "opacity-60",
                        )}
                      >
                        <QuizOptionContent
                          index={optIndex}
                          label={opt.label}
                          state={answers[currentIndex] === opt.id ? "selected" : "idle"}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
                שאלה הבאה
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
