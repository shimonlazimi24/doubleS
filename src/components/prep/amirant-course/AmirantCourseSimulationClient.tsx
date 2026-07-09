"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import {
  amirantExamQuestionPromptForDisplay,
  AMIRANT_PREPARATION_COURSE_ID,
  AMIRANT_QUESTION_POOL,
  getBankQuestion,
  getSimulation,
  loadAnalytics,
  nextSimulationSectionEnterLevel,
  nextStartLevelFromCrossTest,
  pickAdaptiveQuestionIds,
  recordQuestionOutcome,
  recordSessionEnd,
  saveAnalytics,
  writeCrossTestSnapshot,
} from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import type { BankQuestion } from "@/lib/amirant-course/types/bank-question";
import { Card, CardBody, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { AmirantVideoEmbed } from "./lesson/AmirantVideoEmbed";
import { QuizPassagePanel } from "./quiz/QuizPassagePanel";
import { useAmirantPersistence } from "./AmirantPersistenceProvider";
import {
  buildAdaptiveDecisionEvent,
  computeStreakState,
} from "@/lib/amirant-course/adaptive-telemetry";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

type RunPhase = "intro" | "running" | "summary";

type RunState = {
  kind: "pilot" | "scored";
  sectionIndex: number;
  sectionEnterLevel: DifficultyLevel;
  questionIds: string[];
  answers: Record<string, string | null>;
  focusIndex: number;
  timeLeftSec: number;
  globalUsedIds: string[];
  scoredCorrect: number;
  scoredTotal: number;
};

export function AmirantCourseSimulationClient({ simId }: { simId: string }) {
  const { service } = useAmirantPersistence();
  const sim = useMemo(() => getSimulation(simId), [simId]);
  const tieBreakSalt = useMemo(() => `${AMIRANT_PREPARATION_COURSE_ID}:sim:${simId}`, [simId]);

  const [phase, setPhase] = useState<RunPhase>("intro");
  const [run, setRun] = useState<RunState | null>(null);
  const [summary, setSummary] = useState<{ correct: number; total: number } | null>(null);
  const zeroHandled = useRef("");
  const simulationAttemptIdRef = useRef<string | null>(null);
  const questionEnteredAtRef = useRef<number>(Date.now());
  const responseTimesRef = useRef<Record<string, number>>({});
  const telemetryLoggedRef = useRef<Set<string>>(new Set());

  const start = useCallback(() => {
    if (!sim) return;
    const startLevel = nextStartLevelFromCrossTest();
    const pilotIds = pickAdaptiveQuestionIds({
      pool: AMIRANT_QUESTION_POOL,
      topicId: sim.pilot.topicSlug,
      targetLevel: startLevel,
      count: sim.pilot.questionCount,
      excludeIds: [],
      tieBreakSalt: `${tieBreakSalt}:pilot`,
    });
    setSummary(null);
    setPhase("running");
    void service
      .startSimulationAttempt({
        simulationId: sim.id,
        sourceMode: "production",
        startLevel,
      })
      .then((id) => {
        simulationAttemptIdRef.current = id;
      })
      .catch(() => {});
    setRun({
      kind: "pilot",
      sectionIndex: 0,
      sectionEnterLevel: startLevel,
      questionIds: pilotIds,
      answers: Object.fromEntries(pilotIds.map((id) => [id, null as string | null])),
      focusIndex: 0,
      timeLeftSec: sim.pilot.seconds,
      globalUsedIds: [...pilotIds],
      scoredCorrect: 0,
      scoredTotal: 0,
    });
  }, [service, sim, tieBreakSalt]);

  const finishSection = useCallback(
    (opts?: { force?: boolean }) => {
      if (!sim || !run) return;
      const key = `${run.kind}-${run.sectionIndex}-${run.timeLeftSec}`;
      if (opts?.force && zeroHandled.current === key) return;
      if (opts?.force) zeroHandled.current = key;

      const ids = run.questionIds;
      const gradeInOrder = () => {
        let c = 0;
        let t = 0;
        for (const qid of ids) {
          const row = getBankQuestion(qid);
          const ans = run.answers[qid];
          if (!row || ans == null) continue;
          t += 1;
          if (ans === row.correctOptionId) c += 1;
        }
        return { c, t };
      };

      if (run.kind === "pilot") {
        const first = sim.sections[0];
        if (!first) return;
        const scoredIds = pickAdaptiveQuestionIds({
          pool: AMIRANT_QUESTION_POOL,
          topicId: first.topicSlug,
          targetLevel: run.sectionEnterLevel,
          count: first.questionCount,
          excludeIds: Array.from(new Set(run.globalUsedIds)),
          tieBreakSalt: `${tieBreakSalt}:s0`,
        });
        setRun({
          kind: "scored",
          sectionIndex: 0,
          sectionEnterLevel: run.sectionEnterLevel,
          questionIds: scoredIds,
          answers: Object.fromEntries(scoredIds.map((id) => [id, null as string | null])),
          focusIndex: 0,
          timeLeftSec: first.seconds,
          globalUsedIds: Array.from(new Set([...run.globalUsedIds, ...scoredIds])),
          scoredCorrect: 0,
          scoredTotal: 0,
        });
        return;
      }

      const { c, t } = gradeInOrder();
      const sectionAnswers = ids.flatMap((qid) => {
        const row = getBankQuestion(qid);
        if (!row) return [];
        const selected = run.answers[qid] ?? null;
        return [
          {
            questionId: row.id,
            topic: row.topicSlug,
            subtopic: row.subtopicSlug,
            difficulty: row.difficulty,
            selectedOptionId: selected,
            correctOptionId: row.correctOptionId,
            isCorrect: selected === row.correctOptionId,
            responseTimeMs: responseTimesRef.current[row.id] || undefined,
          },
        ];
      });
      const attemptId = simulationAttemptIdRef.current;
      if (attemptId) {
        const sectionLabelForPersist = sim.sections[run.sectionIndex]?.label ?? `section-${run.sectionIndex + 1}`;
        void service
          .submitSimulationSection({
            attemptId,
            sectionIndex: run.sectionIndex,
            sectionKind: run.kind,
            sectionLabel: sectionLabelForPersist,
            topic: sim.sections[run.sectionIndex]?.topicSlug ?? "unknown",
            enterLevel: run.sectionEnterLevel,
            questionCount: ids.length,
            correctCount: c,
            timeLimitSec: sim.sections[run.sectionIndex]?.seconds ?? 0,
            elapsedSec: (sim.sections[run.sectionIndex]?.seconds ?? 0) - run.timeLeftSec,
            answers: sectionAnswers,
          })
          .catch(() => {});
      }
      let nextA = loadAnalytics();
      for (const qid of ids) {
        const row = getBankQuestion(qid);
        const ans = run.answers[qid];
        if (!row || ans == null) continue;
        const ok = ans === row.correctOptionId;
        nextA = recordQuestionOutcome(nextA, {
          topicSlug: row.topicSlug,
          subtopicSlug: row.subtopicSlug,
          difficulty: row.difficulty,
          isCorrect: ok,
        });
      }

      const nextIdx = run.sectionIndex + 1;
      const nextLevel = nextSimulationSectionEnterLevel(run.sectionEnterLevel, c, t);
      const scoredCorrect = run.scoredCorrect + c;
      const scoredTotal = run.scoredTotal + t;

      if (nextIdx >= sim.sections.length) {
        const pct = scoredTotal > 0 ? Math.round((scoredCorrect / scoredTotal) * 100) : 0;
        nextA = recordSessionEnd(nextA, {
          kind: "simulation",
          label: sim.title,
          scorePct: pct,
        });
        saveAnalytics(nextA);
        writeCrossTestSnapshot({
          lastEndLevel: nextLevel,
          lastScorePct: pct,
          updatedAt: new Date().toISOString(),
        });
        if (attemptId) {
          void service
            .submitSimulationAttempt({
              attemptId,
              scorePct: pct,
              scoredQuestionCount: scoredTotal,
              scoredCorrectCount: scoredCorrect,
              startLevel: run.sectionEnterLevel,
              endLevel: nextLevel,
            })
            .catch(() => {});
          void service
            .upsertCrossTestState({
              lastEndLevel: nextLevel,
              lastScorePct: pct,
            })
            .catch(() => {});
          void service
            .appendLearningEvent({
              eventType: "simulation_submitted",
              simulationAttemptId: attemptId,
              metadata: { simulationId: sim.id, scorePct: pct },
            })
            .catch(() => {});
        }
        setSummary({ correct: scoredCorrect, total: scoredTotal });
        setPhase("summary");
        setRun(null);
        return;
      }

      saveAnalytics(nextA);

      const sec = sim.sections[nextIdx]!;
      const nextIds = pickAdaptiveQuestionIds({
        pool: AMIRANT_QUESTION_POOL,
        topicId: sec.topicSlug,
        targetLevel: nextLevel,
        count: sec.questionCount,
        excludeIds: Array.from(new Set(run.globalUsedIds)),
        tieBreakSalt: `${tieBreakSalt}:s${nextIdx}`,
      });

      setRun({
        kind: "scored",
        sectionIndex: nextIdx,
        sectionEnterLevel: nextLevel,
        questionIds: nextIds,
        answers: Object.fromEntries(nextIds.map((id) => [id, null as string | null])),
        focusIndex: 0,
        timeLeftSec: sec.seconds,
        globalUsedIds: Array.from(new Set([...run.globalUsedIds, ...nextIds])),
        scoredCorrect,
        scoredTotal,
      });
    },
    [run, service, sim, tieBreakSalt],
  );

  useEffect(() => {
    if (phase !== "running" || !run || run.timeLeftSec > 0) return;
    finishSection({ force: true });
  }, [phase, run, finishSection]);

  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      setRun((prev) => {
        if (!prev) return prev;
        if (prev.timeLeftSec <= 0) return prev;
        return { ...prev, timeLeftSec: prev.timeLeftSec - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, run?.kind, run?.sectionIndex]);

  const setAnswer = useCallback((qid: string, opt: string) => {
    if (!responseTimesRef.current[qid]) {
      responseTimesRef.current[qid] = Math.max(1, Date.now() - questionEnteredAtRef.current);
    }
    setRun((prev) => {
      if (!prev) return prev;
      return { ...prev, answers: { ...prev.answers, [qid]: opt } };
    });
  }, []);

  useEffect(() => {
    questionEnteredAtRef.current = Date.now();
  }, [run?.focusIndex, run?.sectionIndex, run?.kind]);

  useEffect(() => {
    if (!run) return;
    const qid = run.questionIds[run.focusIndex];
    const q = qid ? getBankQuestion(qid) : undefined;
    if (!qid || !q) return;
    const sessionId = simulationAttemptIdRef.current ?? undefined;
    const key = `${sessionId ?? "local"}:${run.kind}:${run.sectionIndex}:${run.focusIndex}:${qid}`;
    if (telemetryLoggedRef.current.has(key)) return;

    const answersMap = new Map<string, string | null>(
      run.questionIds.map((id) => [id, run.answers[id] ?? null]),
    );
    const sectionBankById = new Map<string, BankQuestion>();
    for (const id of run.questionIds) {
      const row = getBankQuestion(id);
      if (row) sectionBankById.set(id, row);
    }
    const streak = computeStreakState({
      questionIds: run.questionIds,
      answersByQuestionId: answersMap,
      bankById: sectionBankById,
      upToIndexExclusive: run.focusIndex,
    });
    const event = buildAdaptiveDecisionEvent({
      topic: q.topicSlug,
      previousLevel: run.sectionEnterLevel,
      selectedLevel: q.difficulty,
      reason: `simulation_question_selection;kind=${run.kind};sectionIndex=${run.sectionIndex}`,
      streak: { correct: streak.correct, wrong: streak.wrong },
      recentAccuracy: streak.recentAccuracy,
      questionId: q.id,
      sessionId,
    });
    telemetryLoggedRef.current.add(key);
    void service.recordAdaptiveDecision(event).catch(() => {});
  }, [run, service]);

  if (!sim) {
    return (
      <Card className="m-6 p-6">
        <Text as="p" variant="body">
          סימולציה לא נמצאה.
        </Text>
        <Link href={COURSE_BASE} className="mt-4 inline-block text-primary">
          חזרה
        </Link>
      </Card>
    );
  }

  const sectionLabel =
    run?.kind === "pilot"
      ? `פיילוט (${sim.pilot.questionCount} שאלות, לא נספר)`
      : sim.sections[run?.sectionIndex ?? 0]?.label ?? "";

  return (
    <div className="space-y-6">
      {phase === "intro" && (
        <Card>
          <CardBody className="space-y-4 p-6">
            <Text as="h2" variant="headlineSm">
              {sim.title}
            </Text>
            <AmirantVideoEmbed src={sim.videoPath ?? null} title={`סרטון הסבר - ${sim.title}`} />
            <Text as="p" variant="bodySm" className="text-muted">
              פיילוט {Math.round(sim.pilot.seconds / 60)} דק׳, אחריו {sim.sections.length} פרקי ציון ({sim.sections.reduce((a, s) => a + s.questionCount, 0)}{" "}
              שאלות) ב־{Math.round(sim.sections.reduce((a, s) => a + s.seconds, 0) / 60)} דק׳. ניתן לעבור בין שאלות באותו פרק עד לסיום.
            </Text>
            <button
              type="button"
              onClick={start}
              className="rounded-control bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card"
            >
              התחלת סימולציה
            </button>
          </CardBody>
        </Card>
      )}

      {phase === "running" && run && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-surface border border-line/80 bg-surface-low px-4 py-3">
            <Text as="p" variant="labelAccent" className="text-primary">
              {sectionLabel}
            </Text>
            <span className="font-mono text-lg font-bold text-ink">{formatClock(run.timeLeftSec)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {run.questionIds.map((qid, i) => (
              <button
                key={qid}
                type="button"
                onClick={() => setRun((p) => (p ? { ...p, focusIndex: i } : p))}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  run.focusIndex === i ? "bg-primary text-white" : "bg-paper text-muted ring-1 ring-line",
                )}
              >
                {i + 1}
                {run.answers[qid] ? " ✓" : ""}
              </button>
            ))}
          </div>

          {(() => {
            const qid = run.questionIds[run.focusIndex];
            const q = qid ? getBankQuestion(qid) : null;
            if (!q) return null;
            return (
              <Card className="overflow-hidden">
                <CardBody className="space-y-6 p-6">
                  <Text as="p" variant="caption" className="text-muted">
                    רמת כניסה לפרק: {run.sectionEnterLevel} · קושי שאלה: {q.difficulty}
                  </Text>
                  <QuizPassagePanel passageId={q.passageId} />
                  <p className="text-base font-medium leading-relaxed text-ink">
                    {amirantExamQuestionPromptForDisplay(q.prompt)}
                  </p>
                  <ul className="space-y-2">
                    {q.options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => setAnswer(q.id, opt.id)}
                          className={cn(
                            "w-full rounded-control border px-4 py-3 text-right text-sm transition",
                            run.answers[q.id] === opt.id
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
                    onClick={() => finishSection()}
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

      {phase === "summary" && summary && (
        <Card>
          <CardBody className="space-y-4 p-6">
            <Text as="h2" variant="headlineSm">
              סיכום - {sim.title}
            </Text>
            <Text as="p" variant="body">
              פרקי ציון: {summary.correct} נכונות מתוך {summary.total} (
              {summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0}%)
            </Text>
            <div className="flex flex-wrap gap-3">
              <Link href={`${COURSE_BASE}/analytics`} className="rounded-control bg-primary px-5 py-2 text-sm font-semibold text-white">
                אנליטיקה
              </Link>
              <Link href={COURSE_BASE} className="rounded-control border border-line px-5 py-2 text-sm font-semibold text-primary">
                לקורס
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
