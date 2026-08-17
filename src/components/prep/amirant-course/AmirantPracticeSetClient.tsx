"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  amirantExamQuestionPromptForDisplay,
  loadAnalytics,
  recordQuestionOutcome,
  recordSessionEnd,
  saveAnalytics,
} from "@/lib/amirant-course";
import { getPublicBankQuestion } from "@/lib/amirant-course/question-bank/client-bank";
import { gradeBatchAnswers, type GradeBatchItem } from "@/lib/amirant-course/grade-client";
import type { AmirantCourseAnalytics } from "@/lib/amirant-course/analytics/types";
import { AMIRANT_TOPIC_LABEL_HE } from "@/lib/amirant-course/topic-labels";
import type { AmirantBankTopicSlug } from "@/lib/amirant-course/types/bank-question";
import { PREP_BASE } from "@/lib/prep/constants";
import { Card, CardBody, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { QuizPassagePanel } from "./quiz/QuizPassagePanel";
import { PremiumMarkdownBody } from "./premium/PremiumMarkdownBody";
import { showPrepToast } from "@/lib/prep/show-prep-toast";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

type PracticeVariant = "default" | "weak_quiz";

function topicAccuracy(roll: { correct: number; total: number } | undefined): number | null {
  if (!roll || roll.total <= 0) return null;
  return roll.correct / roll.total;
}

function buildTopicImprovementLines(params: {
  preByTopic: AmirantCourseAnalytics["byTopic"];
  postByTopic: AmirantCourseAnalytics["byTopic"];
  topics: AmirantBankTopicSlug[];
}): string[] {
  const lines: string[] = [];
  for (const topic of params.topics) {
    const pre = params.preByTopic[topic];
    const post = params.postByTopic[topic];
    const preA = topicAccuracy(pre);
    const postA = topicAccuracy(post);
    const label = AMIRANT_TOPIC_LABEL_HE[topic] ?? topic;
    if (preA == null && postA != null) {
      lines.push(
        `${label}: בסיס אחרי הסט - ${Math.round(postA * 100)}% (נתון ראשון בנישה זו)`,
      );
    } else if (preA != null && postA != null) {
      const d = Math.round((postA - preA) * 100);
      if (d !== 0) {
        lines.push(
          `${label}: ${Math.round(preA * 100)}% ← ${Math.round(postA * 100)}% (${d > 0 ? "+" : ""}${d} נק׳ דיוק)`,
        );
      } else {
        lines.push(`${label}: יציב סביב ${Math.round(postA * 100)}% - עקבו אחרי רצף הימים הבאים`);
      }
    }
  }
  return lines;
}

export function AmirantPracticeSetClient({
  title,
  questionIds,
  variant = "default",
}: {
  title: string;
  questionIds: string[];
  variant?: PracticeVariant;
}) {
  const [answers, setAnswers] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(questionIds.map((id) => [id, null as string | null])),
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<{ c: number; t: number } | null>(null);
  const [gradeById, setGradeById] = useState<Record<string, GradeBatchItem>>({});
  const [topicLiftLines, setTopicLiftLines] = useState<string[] | null>(null);
  const preAnalyticsRef = useRef<ReturnType<typeof loadAnalytics> | null>(null);
  useEffect(() => {
    if (preAnalyticsRef.current == null) {
      preAnalyticsRef.current = loadAnalytics();
    }
  }, []);

  const rows = useMemo(
    () =>
      questionIds
        .map((id) => ({ id, q: getPublicBankQuestion(id) }))
        .filter((x): x is { id: string; q: NonNullable<ReturnType<typeof getPublicBankQuestion>> } => Boolean(x.q)),
    [questionIds],
  );

  const submit = useCallback(() => {
    if (submitting) return;
    setSubmitting(true);
    void gradeBatchAnswers(
      rows.map(({ id }) => ({
        questionId: id,
        selectedOptionId: answers[id] ?? null,
      })),
      true,
    )
      .then((batch) => {
        const byId = Object.fromEntries(batch.items.map((item) => [item.questionId, item]));
        setGradeById(byId);

        let c = 0;
        let nextA = loadAnalytics();
        for (const { id, q } of rows) {
          const ans = answers[id];
          if (ans == null) continue;
          const ok = byId[id]?.isCorrect === true;
          if (ok) c += 1;
          nextA = recordQuestionOutcome(nextA, {
            topicSlug: q.topicSlug,
            subtopicSlug: q.subtopicSlug,
            difficulty: q.difficulty,
            isCorrect: ok,
          });
        }
        const t = rows.filter((r) => answers[r.id] != null).length;
        const pct = t > 0 ? Math.round((c / t) * 100) : 0;
        nextA = recordSessionEnd(nextA, { kind: "practice", label: title, scorePct: pct });
        saveAnalytics(nextA);
        setScore({ c, t });
        if (variant === "weak_quiz" && preAnalyticsRef.current) {
          const topicSet = new Set<AmirantBankTopicSlug>();
          for (const r of rows) topicSet.add(r.q.topicSlug);
          const lines = buildTopicImprovementLines({
            preByTopic: preAnalyticsRef.current.byTopic,
            postByTopic: nextA.byTopic,
            topics: Array.from(topicSet),
          });
          setTopicLiftLines(lines.length ? lines : null);
        } else {
          setTopicLiftLines(null);
        }
        setSubmitted(true);
      })
      .catch(() => {
        showPrepToast("בדיקת התשובות נכשלה. נסו שוב.", { tone: "error" });
      })
      .finally(() => setSubmitting(false));
  }, [answers, rows, submitting, title, variant]);

  return (
    <div className="space-y-6">
      <Text as="h1" variant="titlePage">
        {title}
      </Text>
      {submitted && score && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardBody className="space-y-2 p-4 text-sm">
            <Text as="p" variant="body" className="text-ink">
              תוצאה: {score.c} / {score.t}
            </Text>
            {variant === "weak_quiz" && topicLiftLines && topicLiftLines.length > 0 ? (
              <div className="rounded-control border border-emerald-500/25 bg-paper/80 px-3 py-2">
                <Text as="p" variant="labelAccent" className="text-emerald-800/90">
                  שיפור לפי נושא (השוואה לנתוני לפני הסט)
                </Text>
                <ul className="mt-1.5 list-disc space-y-1 pr-4 text-ink/90">
                  {topicLiftLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-0.5">
              <Link href={`${COURSE_BASE}/analytics`} className="text-primary underline">
                אנליטיקה
              </Link>
            </div>
          </CardBody>
        </Card>
      )}
      <ol className="space-y-8">
        {rows.map(({ id, q }, idx) => {
          const graded = gradeById[id];
          const correctOptionId = graded?.correctOptionId ?? null;
          return (
            <li key={id}>
              <Card>
                <CardBody className="space-y-4 p-6">
                  <Text as="p" variant="caption" className="text-muted">
                    שאלה {idx + 1}
                  </Text>
                  <QuizPassagePanel passageId={q.passageId} />
                  <p className="font-medium text-ink" dir="ltr" style={{ textAlign: "left" }}>{amirantExamQuestionPromptForDisplay(q.prompt)}</p>
                  <ul className="space-y-2">
                    {q.options.map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          disabled={submitted || submitting}
                          onClick={() => setAnswers((p) => ({ ...p, [id]: opt.id }))}
                          className={cn(
                            "w-full rounded-control border px-4 py-3 text-right text-sm transition",
                            answers[id] === opt.id
                              ? "border-primary bg-primary/10 font-semibold text-primary"
                              : "border-line/80 bg-paper hover:border-primary/40",
                            submitted && correctOptionId != null && opt.id === correctOptionId && "ring-2 ring-emerald-500/50",
                            submitted &&
                              answers[id] === opt.id &&
                              correctOptionId != null &&
                              opt.id !== correctOptionId &&
                              "ring-2 ring-amber-500/40",
                          )}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {submitted && graded?.explanation ? (
                    // "הערת מורה" - עקבי עם התרגול בשיעורים
                    <div className="rounded-e-xl border-s-[3px] border-pen/70 bg-pen/[0.04] p-4">
                      <p className="mb-1.5 text-[11px] font-bold tracking-wide text-pen">הסבר</p>
                      <PremiumMarkdownBody body={graded.explanation} variant="card" />
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ol>
      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-control bg-primary px-6 py-3 text-sm font-semibold text-white shadow-card disabled:opacity-40"
        >
          {submitting ? "בודקים…" : "שליחה ובדיקה"}
        </button>
      ) : null}
    </div>
  );
}
