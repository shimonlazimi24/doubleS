"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardTitle, Container, Text } from "@/components/ui";
import {
  applyStreakLevelTransition,
  buildSubtopicMasteryView,
  rankWeakestSubtopics,
  selectNextQuestion,
  type DifficultyLevel,
  type LearnerSubtopicStatsRow,
  type SubtopicMasteryView,
} from "@/lib/learning-intelligence/adaptive";
import {
  AMIRANT_DEMO_COURSE,
  AMIRANT_DEMO_MODULES,
  AMIRANT_DEMO_QUESTIONS,
  AMIRANT_DEMO_QUESTION_POOL,
  AMIRANT_DEMO_QUIZ,
  AMIRANT_DEMO_SHORT_QUIZ_LENGTH,
  AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL,
  getFirstShortDemoQuestionId,
  type DemoQuestion,
} from "@/lib/prep/amirant-demo/demo-course-content";
import { pickDistinctQuestionIds } from "@/lib/prep/amirant-demo/amirant-sim-selection";
import {
  discreteLevelFromTheta,
  readStoredThetaBetweenExams,
  updateThetaFromSectionResponses,
  writeStoredExamOutcome,
} from "@/lib/prep/amirant-demo/adaptive-exam-psychometrics";
import { amirantExamQuestionPromptForDisplay } from "@/lib/amirant-course";
import { AMIRANT_SIMULATION_TECH } from "@/lib/prep/amirant-course-syllabus";
import { AMIRANT_DEMO_IDS } from "@/lib/prep/amirant-demo/seed-constants";
import { PREP_BASE } from "@/lib/prep/constants";
import { cn } from "@/lib/design-system/cn";

const DEMO_USER_ID = "20000001-0000-4000-8000-000000009998";
const T = AMIRANT_DEMO_IDS.topics;
const DEMO_TIE_SALT = `amirant-practice:${AMIRANT_DEMO_IDS.course}` as const;

/** Free short demo: sentence completion → rephrasing → reading (repeats to 10). */
const SHORT_QUIZ_TOPIC_CYCLE: string[] = [T.sentence, T.rephrasing, T.reading];

const SUBTOPIC_LABEL_HE: Record<string, string> = {
  [AMIRANT_DEMO_IDS.subtopics.academicVerbs]: "פעלים אקדמיים",
  [AMIRANT_DEMO_IDS.subtopics.synonyms]: "מילים נרדפות",
  [AMIRANT_DEMO_IDS.subtopics.mainIdea]: "רעיון מרכזי וטון",
  [AMIRANT_DEMO_IDS.subtopics.inference]: "הסקה מהקריאה",
  [AMIRANT_DEMO_IDS.subtopics.connectors]: "מילות קישור",
  [AMIRANT_DEMO_IDS.subtopics.collocations]: "צירופי מילים",
  [AMIRANT_DEMO_IDS.subtopics.restatement]: "ניסוח מחדש (משמעות)",
};

const TOPIC_TYPE_LABEL_HE: Record<string, string> = {
  [T.sentence]: "השלמת משפטים",
  [T.rephrasing]: "ניסוח מחדש",
  [T.reading]: "הבנת הנקרא",
};

const SESSION_LENGTH_SHORT = AMIRANT_DEMO_SHORT_QUIZ_LENGTH;
const RECENT_WINDOW = 5;

/** ארבעת פרקי הציון - 8+8+9+14 דק׳ = 39 דק׳ (עקבי עם סילבוס). */
const SCORED_SECTION_SPEC = [
  { topicId: T.sentence, seconds: 8 * 60, label: "פרק ציון 1 - השלמת משפטים (דמו)" },
  { topicId: T.sentence, seconds: 8 * 60, label: "פרק ציון 2 - השלמת משפטים (דמו)" },
  { topicId: T.vocabulary, seconds: 9 * 60, label: "פרק ציון 3 - אוצר מילים (דמו)" },
  { topicId: T.reading, seconds: 14 * 60, label: "פרק ציון 4 - הבנת הנקרא (דמו)" },
] as const;

const PILOT_SPEC = {
  topicId: T.reading,
  questionCount: 2,
  seconds: 5 * 60,
  label: "פרק פיילוט (לא נספר לציון)",
} as const;


const QUESTIONS_BY_ID = new Map(AMIRANT_DEMO_QUESTIONS.map((q) => [q.id, q]));

type TopicAdaptive = {
  currentLevel: DifficultyLevel;
  correctStreak: number;
  wrongStreak: number;
};

function initialTopicState(): TopicAdaptive {
  return { currentLevel: 2, correctStreak: 0, wrongStreak: 0 };
}

function initialShortDemoTopicState(): TopicAdaptive {
  return { currentLevel: 3, correctStreak: 0, wrongStreak: 0 };
}

function pickFallbackInTopic(pool: typeof AMIRANT_DEMO_QUESTION_POOL, topicId: string) {
  const inTopic = pool.filter((q) => q.topicId === topicId);
  if (inTopic.length === 0) return null;
  return [...inTopic].sort((a, b) => a.questionId.localeCompare(b.questionId))[0];
}

type Phase = "outline" | "short-quiz" | "short-summary" | "full-exam" | "full-summary";

type FullExamState = {
  kind: "pilot" | "scored";
  sectionIndex: number;
  adaptiveLevel: DifficultyLevel;
  /** הערכת יכולת רציפה (1–6); מתעדכנת אחרי כל פרק ציון (לא מהפיילוט). */
  thetaEstimate: number;
  questionIds: string[];
  answers: Record<string, string | null>;
  focusIndex: number;
  timeLeftSec: number;
  globalUsedIds: string[];
  /** צבירה לפרקי ציון בלבד (לא כולל פיילוט). */
  scoredCorrectRunning: number;
  scoredTotalRunning: number;
};

function formatClock(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type AmirantPracticeFlowProps = {
  embedded?: boolean;
  /** Only the 10-question intermediate+ short session (no course outline / full sim). */
  shortQuizOnly?: boolean;
};

export function AmirantPracticeFlow({ embedded = false, shortQuizOnly = false }: AmirantPracticeFlowProps) {
  const [phase, setPhase] = useState<Phase>(() => (shortQuizOnly ? "short-quiz" : "outline"));
  const [topicLevels, setTopicLevels] = useState<Record<string, TopicAdaptive>>(() =>
    Object.fromEntries(SHORT_QUIZ_TOPIC_CYCLE.map((id) => [id, initialShortDemoTopicState()])),
  );
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(() =>
    shortQuizOnly ? getFirstShortDemoQuestionId(DEMO_TIE_SALT) : null,
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [subtopicRows, setSubtopicRows] = useState<Record<string, LearnerSubtopicStatsRow>>({});

  const [fullExam, setFullExam] = useState<FullExamState | null>(null);
  const [fullScoredResults, setFullScoredResults] = useState<{
    correct: number;
    total: number;
    theta: number;
  } | null>(null);
  const zeroTimeHandledRef = useRef<string>("");

  const tieBreakSalt = DEMO_TIE_SALT;

  const updateSubtopicRow = useCallback((q: DemoQuestion, isCorrect: boolean) => {
    setSubtopicRows((prev) => {
      const key = q.subtopicId;
      const base: LearnerSubtopicStatsRow = prev[key] ?? {
        userId: DEMO_USER_ID,
        courseId: AMIRANT_DEMO_IDS.course,
        topicId: q.topicId,
        subtopicId: q.subtopicId,
        totalAnswered: 0,
        correctAnswered: 0,
        wrongAnswered: 0,
        sumResponseTimeSec: 0,
        lastAnsweredAt: null,
      };
      const rt = 42;
      return {
        ...prev,
        [key]: {
          ...base,
          totalAnswered: base.totalAnswered + 1,
          correctAnswered: base.correctAnswered + (isCorrect ? 1 : 0),
          wrongAnswered: base.wrongAnswered + (isCorrect ? 0 : 1),
          sumResponseTimeSec: base.sumResponseTimeSec + rt,
        },
      };
    });
  }, []);

  const startShortQuiz = useCallback(() => {
    setPhase("short-quiz");
    setQuestionIndex(0);
    setTopicLevels(
      Object.fromEntries(SHORT_QUIZ_TOPIC_CYCLE.map((id) => [id, initialShortDemoTopicState()])),
    );
    setRecentQuestionIds([]);
    setSubtopicRows({});
    setLastFeedback(null);
    setSelectedOptionId(null);
    setFullExam(null);
    setFullScoredResults(null);

    const firstTopic = SHORT_QUIZ_TOPIC_CYCLE[0];
    const level = initialShortDemoTopicState().currentLevel;
    const sel =
      selectNextQuestion({
        pool: AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL,
        topicId: firstTopic,
        targetLevel: level,
        recentQuestionIds: [],
        tieBreakSalt,
      }) ?? pickFallbackInTopic(AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL, firstTopic);
    setCurrentQuestionId(sel?.questionId ?? null);
  }, []);

  const startFullExam = useCallback(() => {
    setSubtopicRows({});
    setFullScoredResults(null);
    const theta0 = readStoredThetaBetweenExams();
    const startLevel = discreteLevelFromTheta(theta0);
    const pilotIds = pickDistinctQuestionIds({
      pool: AMIRANT_DEMO_QUESTION_POOL,
      topicId: PILOT_SPEC.topicId,
      targetLevel: 2,
      count: PILOT_SPEC.questionCount,
      excludeIds: [],
      tieBreakSalt: `${tieBreakSalt}:pilot`,
    });
    zeroTimeHandledRef.current = "";
    setFullExam({
      kind: "pilot",
      sectionIndex: 0,
      adaptiveLevel: startLevel,
      thetaEstimate: theta0,
      questionIds: pilotIds,
      answers: Object.fromEntries(pilotIds.map((id) => [id, null as string | null])),
      focusIndex: 0,
      timeLeftSec: PILOT_SPEC.seconds,
      globalUsedIds: [...pilotIds],
      scoredCorrectRunning: 0,
      scoredTotalRunning: 0,
    });
    setPhase("full-exam");
  }, []);

  const currentQuestion = currentQuestionId ? (QUESTIONS_BY_ID.get(currentQuestionId) ?? null) : null;

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    // Deterministic shuffle per question so position varies across questions
    const seed = currentQuestion.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return [...currentQuestion.options].sort((a, b) => {
      const ha = (seed * a.id.charCodeAt(a.id.length - 1)) % 7;
      const hb = (seed * b.id.charCodeAt(b.id.length - 1)) % 7;
      return ha - hb;
    });
  }, [currentQuestion]);

  const goToNextShortQuestion = useCallback(
    (afterIndex: number) => {
      if (afterIndex >= SESSION_LENGTH_SHORT - 1) {
        setPhase("short-summary");
        setCurrentQuestionId(null);
        setLastFeedback(null);
        setSelectedOptionId(null);
        return;
      }

      const nextIdx = afterIndex + 1;
      setQuestionIndex(nextIdx);
      setLastFeedback(null);
      setSelectedOptionId(null);

      const nextTopic = SHORT_QUIZ_TOPIC_CYCLE[nextIdx % SHORT_QUIZ_TOPIC_CYCLE.length];
      const adaptive = topicLevels[nextTopic] ?? initialShortDemoTopicState();
      const recent = recentQuestionIds.slice(-RECENT_WINDOW);

    const sel =
      selectNextQuestion({
        pool: AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL,
        topicId: nextTopic,
        targetLevel: adaptive.currentLevel,
        recentQuestionIds: recent,
        excludedInSession: new Set(recentQuestionIds),
        tieBreakSalt,
      }) ?? pickFallbackInTopic(AMIRANT_DEMO_SHORT_QUIZ_QUESTION_POOL, nextTopic);

      setCurrentQuestionId(sel?.questionId ?? null);
    },
    [recentQuestionIds, tieBreakSalt, topicLevels],
  );

  const submitShortAnswer = useCallback(() => {
    if (!currentQuestion || selectedOptionId === null) return;
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

    setLastFeedback({ correct: isCorrect, explanation: currentQuestion.explanation });

    const topicId = currentQuestion.topicId;
    setTopicLevels((prev) => {
      const cur = prev[topicId] ?? initialShortDemoTopicState();
      const t = applyStreakLevelTransition(cur, isCorrect);
      return { ...prev, [topicId]: { currentLevel: t.nextLevel, correctStreak: t.correctStreak, wrongStreak: t.wrongStreak } };
    });

    updateSubtopicRow(currentQuestion, isCorrect);

    setRecentQuestionIds((r) => {
      const next = [...r, currentQuestion.id];
      return next.length > RECENT_WINDOW + 2 ? next.slice(-(RECENT_WINDOW + 2)) : next;
    });
  }, [currentQuestion, selectedOptionId, updateSubtopicRow]);

  const continueAfterShortFeedback = useCallback(() => {
    if (!lastFeedback) return;
    goToNextShortQuestion(questionIndex);
  }, [goToNextShortQuestion, lastFeedback, questionIndex]);

  const masteryViews = useMemo(() => {
    return rankWeakestSubtopics(Object.values(subtopicRows).map((r) => buildSubtopicMasteryView(r)));
  }, [subtopicRows]);

  const weakList = useMemo(() => masteryViews.filter((m) => m.mastery === "weak"), [masteryViews]);

  const fullExamSectionKey = useMemo(
    () =>
      fullExam ? `${fullExam.kind}-${fullExam.sectionIndex}-${fullExam.questionIds.join(",")}` : "",
    [fullExam],
  );

  /** טיימר פרק במבחן המלא - מתאפס רק כשמשתנה פרק (מפתח יציב). */
  useEffect(() => {
    if (phase !== "full-exam" || !fullExamSectionKey) return;
    const t = window.setInterval(() => {
      setFullExam((prev) => {
        if (!prev || prev.timeLeftSec <= 0) return prev;
        return { ...prev, timeLeftSec: prev.timeLeftSec - 1 };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase, fullExamSectionKey]);

  const finishFullSection = useCallback(
    (opts?: { force?: boolean }) => {
      if (!fullExam) return;
      const ids = fullExam.questionIds;
      const unanswered = ids.filter((id) => fullExam.answers[id] == null);
      if (!opts?.force && unanswered.length > 0) {
        const ok = window.confirm(`נותרו ${unanswered.length} שאלות בלי תשובה. לסיים את הפרק בכל זאת?`);
        if (!ok) return;
      }

      if (fullExam.kind === "pilot") {
        const spec = SCORED_SECTION_SPEC[0];
        const scoredIds = pickDistinctQuestionIds({
          pool: AMIRANT_DEMO_QUESTION_POOL,
          topicId: spec.topicId,
          targetLevel: fullExam.adaptiveLevel,
          count: AMIRANT_SIMULATION_TECH.scoredQuestionsPerExam / SCORED_SECTION_SPEC.length,
          excludeIds: fullExam.globalUsedIds,
          tieBreakSalt: `${tieBreakSalt}:scored:0`,
        });
        zeroTimeHandledRef.current = "";
        setFullExam({
          kind: "scored",
          sectionIndex: 0,
          adaptiveLevel: fullExam.adaptiveLevel,
          thetaEstimate: fullExam.thetaEstimate,
          questionIds: scoredIds,
          answers: Object.fromEntries(scoredIds.map((id) => [id, null as string | null])),
          focusIndex: 0,
          timeLeftSec: spec.seconds,
          globalUsedIds: [...fullExam.globalUsedIds, ...scoredIds],
          scoredCorrectRunning: 0,
          scoredTotalRunning: 0,
        });
        return;
      }

      let correct = 0;
      const sectionResponses: { isCorrect: boolean; difficulty: number }[] = [];
      for (const id of fullExam.questionIds) {
        const q = QUESTIONS_BY_ID.get(id);
        if (!q) continue;
        const picked = fullExam.answers[id];
        const ok = picked != null && picked === q.correctOptionId;
        if (ok) correct += 1;
        sectionResponses.push({ isCorrect: ok, difficulty: q.difficulty });
        updateSubtopicRow(q, ok);
      }

      const nextTheta = updateThetaFromSectionResponses(fullExam.thetaEstimate, sectionResponses);
      const nextLevel = discreteLevelFromTheta(nextTheta);
      const scoredCorrectRunning = fullExam.scoredCorrectRunning + correct;
      const scoredTotalRunning = fullExam.scoredTotalRunning + fullExam.questionIds.length;

      if (fullExam.sectionIndex >= SCORED_SECTION_SPEC.length - 1) {
        const scoredPct = scoredTotalRunning > 0 ? (scoredCorrectRunning / scoredTotalRunning) * 100 : 0;
        writeStoredExamOutcome({
          theta: nextTheta,
          scoredPct,
          endDiscreteLevel: discreteLevelFromTheta(nextTheta),
        });
        setFullScoredResults({ correct: scoredCorrectRunning, total: scoredTotalRunning, theta: nextTheta });
        setFullExam(null);
        setPhase("full-summary");
        return;
      }

      const nextIdx = fullExam.sectionIndex + 1;
      const spec = SCORED_SECTION_SPEC[nextIdx];
      const scoredIds = pickDistinctQuestionIds({
        pool: AMIRANT_DEMO_QUESTION_POOL,
        topicId: spec.topicId,
        targetLevel: nextLevel,
        count: AMIRANT_SIMULATION_TECH.scoredQuestionsPerExam / SCORED_SECTION_SPEC.length,
        excludeIds: fullExam.globalUsedIds,
        tieBreakSalt: `${tieBreakSalt}:scored:${nextIdx}`,
      });
      zeroTimeHandledRef.current = "";
      setFullExam({
        kind: "scored",
        sectionIndex: nextIdx,
        adaptiveLevel: nextLevel,
        thetaEstimate: nextTheta,
        questionIds: scoredIds,
        answers: Object.fromEntries(scoredIds.map((id) => [id, null as string | null])),
        focusIndex: 0,
        timeLeftSec: spec.seconds,
        globalUsedIds: [...fullExam.globalUsedIds, ...scoredIds],
        scoredCorrectRunning,
        scoredTotalRunning,
      });
    },
    [fullExam, tieBreakSalt, updateSubtopicRow],
  );

  useEffect(() => {
    if (phase !== "full-exam" || !fullExam || fullExam.timeLeftSec > 0) return;
    if (zeroTimeHandledRef.current === fullExamSectionKey) return;
    zeroTimeHandledRef.current = fullExamSectionKey;
    finishFullSection({ force: true });
  }, [phase, fullExam, fullExam?.timeLeftSec, fullExamSectionKey, finishFullSection]);

  const setFullAnswer = useCallback((questionId: string, optionId: string) => {
    setFullExam((prev) => {
      if (!prev) return prev;
      return { ...prev, answers: { ...prev.answers, [questionId]: optionId } };
    });
  }, []);

  const mainBlock = (
    <>
      {!embedded && (
        <>
          <Text as="h1" variant="titlePage" className="max-w-readable">
            {AMIRANT_DEMO_COURSE.title}
          </Text>
          <Text as="p" variant="body" className="mt-4 max-w-readable text-muted">
            {AMIRANT_DEMO_COURSE.description}
          </Text>
        </>
      )}
      {embedded && !shortQuizOnly && (
        <Text as="p" variant="bodySm" className="max-w-readable text-muted">
          מבנה הקורס לפי הסילבוס; תרגול קצר ({SESSION_LENGTH_SHORT} שאלות, בינוני־מתקדם בלבד) או מבחן מלא: פיילוט + 4 פרקי ציון (16 שאלות, 39 דק׳), ניווט בתוך פרק, טיימר לפרק, והתאמת רמה לפי מודל לוגיסטי מקורב (θ) בין פרקים ובין מבחנים (localStorage).
        </Text>
      )}
      {embedded && shortQuizOnly && (
        <p className="mb-4 max-w-readable text-sm text-[#5a6480]">
          {SESSION_LENGTH_SHORT} שאלות · רמות קושי 3–5 (בינוני ומעלה) · מעורב: השלמת משפטים, ניסוח מחדש, הבנת הנקרא
        </p>
      )}

      {phase === "outline" && !shortQuizOnly && (
        <div className="mt-10 space-y-8">
          <Card className="overflow-hidden">
            <CardTitle className="border-b border-line/60 bg-surface-low px-6 py-4">
              <Text as="span" variant="headlineSm">
                מבנה הקורס
              </Text>
            </CardTitle>
            <CardBody className="space-y-8 p-6">
              {AMIRANT_DEMO_MODULES.map((mod) => (
                <div key={mod.id}>
                  <Text as="h3" variant="headlineSm" className="mb-3">
                    {mod.title}
                  </Text>
                  <ul className="space-y-2 border-r-2 border-primary/25 pr-4">
                    {mod.lessons.map((lesson) => (
                      <li key={lesson.id} className="text-sm text-ink">
                        <span className="font-semibold">{lesson.title}</span>
                        <span className="text-muted">
                          {" "}
                          · {lesson.kind === "video" ? "וידאו" : lesson.kind === "text" ? "טקסט" : "מעורב"}
                        </span>
                        {lesson.id === AMIRANT_DEMO_QUIZ.lessonId && (
                          <span className="mr-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                            מבחן מערכת
                          </span>
                        )}
                        <div className="mt-0.5 text-xs text-muted">{lesson.bodyPreview}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startShortQuiz}
                className="rounded-control bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary/90"
              >
                תרגול אדפטיבי קצר ({SESSION_LENGTH_SHORT} שאלות)
              </button>
              <button
                type="button"
                onClick={startFullExam}
                className="rounded-control border-2 border-primary bg-paper px-6 py-3 text-sm font-semibold text-primary shadow-card transition hover:bg-primary/5"
              >
                מבחן סימולציה מלא (פיילוט + 16 שאלות ציון)
              </button>
            </div>
            <Text as="p" variant="bodySm" className="max-w-readable text-muted">
              במבחן המלא: {AMIRANT_SIMULATION_TECH.pilotSectionsPerExam} פרק פיילוט ({PILOT_SPEC.questionCount}{" "}
              שאלות), אחריו {SCORED_SECTION_SPEC.length} פרקי ציון ({AMIRANT_SIMULATION_TECH.scoredQuestionsPerExam}{" "}
              שאלות) ב־{AMIRANT_SIMULATION_TECH.scoredSectionsTotalMinutes} דק׳ סה״כ לפרקי האמת. רמות קושי בבנק:{" "}
              {AMIRANT_SIMULATION_TECH.difficultyScale.min}–{AMIRANT_SIMULATION_TECH.difficultyScale.max}.
            </Text>
          </div>
        </div>
      )}

      {phase === "short-quiz" && (
        <div className="mt-10">
          {!currentQuestion && (
            <Card className="p-6">
              <Text as="p" variant="body">
                לא נמצאה שאלה מתאימה - נסו להתחיל מחדש.
              </Text>
              <button
                type="button"
                onClick={startShortQuiz}
                className="mt-4 rounded-control border border-line bg-paper px-4 py-2 text-sm font-semibold text-primary"
              >
                התחלה מחדש
              </button>
            </Card>
          )}

          {currentQuestion && !lastFeedback && (
            <Card className="overflow-hidden">
              <div
                className={cn(
                  "border-b px-6 py-3",
                  shortQuizOnly
                    ? "border-[#d4a843]/40 bg-[#0f1e3d] text-white"
                    : "border-line/60 bg-surface-low",
                )}
              >
                <Text
                  as="p"
                  variant="caption"
                  className={shortQuizOnly ? "text-[#f0c96a]" : "text-primary"}
                >
                  {TOPIC_TYPE_LABEL_HE[currentQuestion.topicId] ?? "שאלה"} · שאלה{" "}
                  {questionIndex + 1} מתוך {SESSION_LENGTH_SHORT}
                </Text>
              </div>
              <CardBody className="space-y-6 p-6">
                <p className="text-base font-medium leading-relaxed text-ink">
                  {amirantExamQuestionPromptForDisplay(currentQuestion.prompt)}
                </p>
                <ul className="space-y-2">
                  {shuffledOptions.map((opt) => (
                    <li key={opt.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={cn(
                          "w-full rounded-control border px-4 py-3 text-right text-sm transition",
                          selectedOptionId === opt.id
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-line/80 bg-paper hover:border-primary/40",
                        )}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={selectedOptionId === null}
                  onClick={submitShortAnswer}
                  className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-card disabled:cursor-not-allowed disabled:opacity-40"
                >
                  בדיקת תשובה
                </button>
              </CardBody>
            </Card>
          )}

          {currentQuestion && lastFeedback && (
            <Card className="overflow-hidden">
              <div
                className={cn(
                  "border-b px-6 py-3",
                  lastFeedback.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10",
                )}
              >
                <Text as="p" variant="labelAccent" className={lastFeedback.correct ? "text-emerald-800" : "text-amber-900"}>
                  {lastFeedback.correct ? "נכון" : "לא נכון"}
                </Text>
              </div>
              <CardBody className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-ink">{lastFeedback.explanation}</p>
                <button
                  type="button"
                  onClick={continueAfterShortFeedback}
                  className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-card"
                >
                  {questionIndex >= SESSION_LENGTH_SHORT - 1 ? "לסיכום" : "המשך לשאלה הבאה"}
                </button>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {phase === "short-summary" && (
        <div className="mt-10 space-y-6">
          {(() => {
            const totalAnswered = Object.values(subtopicRows).reduce((s, r) => s + r.totalAnswered, 0);
            const totalCorrect = Object.values(subtopicRows).reduce((s, r) => s + r.correctAnswered, 0);
            const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
            const grade = pct >= 80 ? "מצוין" : pct >= 60 ? "טוב" : "יש מקום לשיפור";
            return (
              <Card className="p-6 text-center">
                <p className="text-5xl font-bold text-primary tabular-nums">{pct}%</p>
                <p className="mt-2 text-lg font-semibold text-ink">{grade}</p>
                <p className="mt-1 text-sm text-muted">{totalCorrect} מתוך {totalAnswered} שאלות נכונות</p>
              </Card>
            );
          })()}

          {weakList.length > 0 && (
            <Card className="border-amber-500/25 bg-amber-500/5 p-6">
              <Text as="h3" variant="headlineSm" className="mb-3">
                נושאים לחיזוק
              </Text>
              <ul className="space-y-1.5">
                {weakList.map((w) => (
                  <li key={w.subtopicId} className="flex items-center gap-2 text-sm text-ink">
                    <span className="text-amber-600">•</span>
                    <span>{SUBTOPIC_LABEL_HE[w.subtopicId] ?? w.subtopicId}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startShortQuiz}
              className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-card"
            >
              הרצה נוספת
            </button>
            {shortQuizOnly ? (
              <button
                type="button"
                onClick={() =>
                  document.getElementById("amirant-demo-hero")?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-control border border-line bg-paper px-6 py-2.5 text-sm font-semibold text-primary"
              >
                חזרה לראש הדף
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPhase("outline")}
                className="rounded-control border border-line bg-paper px-6 py-2.5 text-sm font-semibold text-primary"
              >
                חזרה למבנה הקורס
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "full-exam" && fullExam && !shortQuizOnly && (
        <div className="mt-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-surface border border-line/80 bg-surface-low px-4 py-3">
            <Text as="p" variant="labelAccent" className="text-primary">
              {fullExam.kind === "pilot" ? PILOT_SPEC.label : SCORED_SECTION_SPEC[fullExam.sectionIndex]?.label}
            </Text>
            <span className="font-mono text-lg font-bold text-ink">{formatClock(fullExam.timeLeftSec)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {fullExam.questionIds.map((qid, i) => (
              <button
                key={qid}
                type="button"
                onClick={() => setFullExam((p) => (p ? { ...p, focusIndex: i } : p))}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  fullExam.focusIndex === i ? "bg-primary text-white" : "bg-paper text-muted ring-1 ring-line",
                )}
              >
                {i + 1}
                {fullExam.answers[qid] ? " ✓" : ""}
              </button>
            ))}
          </div>

          {(() => {
            const qid = fullExam.questionIds[fullExam.focusIndex];
            const fq = qid ? QUESTIONS_BY_ID.get(qid) : null;
            if (!fq) return null;
            return (
              <Card className="overflow-hidden">
                <CardBody className="space-y-6 p-6">
                  <Text as="p" variant="caption" className="text-muted">
                    רמת קושי בבנק: {fq.difficulty}
                    {fullExam.kind === "scored"
                      ? ` · הערכת יכולת θ ≈ ${fullExam.thetaEstimate.toFixed(2)} (מודל מקורב)`
                      : ""}{" "}
                    · ניתן לשנות תשובה עד סיום הפרק
                  </Text>
                  <p className="text-base font-medium leading-relaxed text-ink">
                    {amirantExamQuestionPromptForDisplay(fq.prompt)}
                  </p>
                  <ul className="space-y-2">
                    {fq.options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => setFullAnswer(fq.id, opt.id)}
                          className={cn(
                            "w-full rounded-control border px-4 py-3 text-right text-sm transition",
                            fullExam.answers[fq.id] === opt.id
                              ? "border-primary bg-primary/10 font-semibold text-primary"
                              : "border-line/80 bg-paper hover:border-primary/40",
                          )}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => finishFullSection()}
                    className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-card"
                  >
                    סיום פרק והמשך
                  </button>
                </CardBody>
              </Card>
            );
          })()}
        </div>
      )}

      {phase === "full-summary" && !shortQuizOnly && (
        <div className="mt-10 space-y-6">
          <Text as="h2" variant="headline">
            סיכום מבחן מלא
          </Text>
          <Text as="p" variant="body" className="max-w-readable text-muted">
            הפרקים הנספרים לציון כללו {AMIRANT_SIMULATION_TECH.scoredQuestionsPerExam} שאלות. אחרי כל פרק עודכנה הערכת היכולת θ לפי קושי השאלות והתשובות (קירוב ל־IRT/1PL - לא זהה למאל״ו). הניקוד, θ והתאמה למבחן הבא נשמרים בדפדפן (מקומי).
          </Text>
          {fullScoredResults && (
            <Card className="p-6">
              <Text as="p" variant="body">
                ביצוע בפרקי הציון: {fullScoredResults.correct} נכונות מתוך {fullScoredResults.total} (
                {fullScoredResults.total > 0 ? Math.round((fullScoredResults.correct / fullScoredResults.total) * 100) : 0}
                %)
              </Text>
              <Text as="p" variant="bodySm" className="mt-3 text-muted">
                הערכת יכולת סופית (θ): ≈ {fullScoredResults.theta.toFixed(2)} על סולם 1–6 - משמשת לנקודת פתיחה במבחן הבא.
              </Text>
            </Card>
          )}
          <Card className="p-6">
            <Text as="h3" variant="headlineSm" className="mb-4">
              תתי-נושאים (מהחלש לחזק)
            </Text>
            <ul className="space-y-3">
              {masteryViews.map((m) => (
                <li
                  key={m.subtopicId}
                  className="flex flex-col gap-2 rounded-control border border-line/60 bg-paper px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <span className="font-semibold text-ink sm:max-w-[42%]">
                    {SUBTOPIC_LABEL_HE[m.subtopicId] ?? m.subtopicId}
                  </span>
                  <p className="text-muted sm:text-end">
                    {m.totalAnswered} שאלות · {Math.round(m.accuracy * 100)}% נכונות
                  </p>
                </li>
              ))}
            </ul>
          </Card>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startFullExam}
              className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-card"
            >
              מבחן מלא נוסף
            </button>
            <button
              type="button"
              onClick={() => {
                setFullScoredResults(null);
                setPhase("outline");
              }}
              className="rounded-control border border-line bg-paper px-6 py-2.5 text-sm font-semibold text-primary"
            >
              חזרה למבנה הקורס
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div
        className={cn("max-w-shell w-full", shortQuizOnly && "text-[#1a1a2e] [font-family:var(--amirant-demo-font,sans-serif)]")}
      >
        {mainBlock}
      </div>
    );
  }

  return (
    <div className="bg-canvas">
      <div className="border-b border-primary/15 bg-primary/5">
        <Container className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text as="p" variant="caption" className="font-semibold text-primary">
              תרגול ומבחני סימולציה - נתונים מקומיים בלבד. בנק שאלות כמו בזרע SQL.
            </Text>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <Link href={`${PREP_BASE}/amirant/demo`} className="text-primary underline-offset-4 hover:underline">
                דמו מלא
              </Link>
              <Link href={`${PREP_BASE}/amirant`} className="text-primary underline-offset-4 hover:underline">
                עמוד אמירנט
              </Link>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-8 md:py-10">{mainBlock}</Container>
    </div>
  );
}
