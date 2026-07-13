"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stripLeadingDuplicateSectionHeading } from "@/lib/amirant-course/lesson-content/strip-duplicate-section-heading";
import { stripEdgeSeparatorNoise, stripTakeawayBlocksFromBody } from "@/lib/amirant-course/lesson-content/strip-lesson-markdown-noise";
import { markdownishToPlain } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import { takeawayLineFromLessonBody } from "@/lib/amirant-course/lesson-content/takeaway-line-from-body";
import { LessonBlockCard } from "../lesson/LessonBlockCard";
import { LessonHeroCard } from "../lesson/LessonHeroCard";
import { LessonInteractionBlock } from "../lesson/LessonInteractionBlock";
import { LessonAiBlock } from "../lesson/LessonAiBlock";
import { LessonKeyTakeawayClosing } from "../lesson/LessonKeyTakeawayClosing";
import { LessonFooterCTA } from "../lesson/LessonFooterCTA";
import { AmirantInlineQuestionsCard } from "../lesson/AmirantInlineQuestionsCard";
import { VocabularyLessonExperience } from "../VocabularyLessonExperience";
import type { VocabParseResult } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";
import { lessonSaaS } from "../lesson/ui/lesson-saas-tokens";
import { LessonHeader } from "../lesson/ui/LessonHeader";
import { CourseOutlineSidebar } from "../course-outline/CourseOutlineSidebar";
import { AmirantLessonTrackIsland } from "../AmirantLessonTrackIsland";
import { LessonStepContent } from "./LessonStepContent";
import { LessonNavigationFooter } from "../lesson/ui/LessonNavigationFooter";
import { LessonMobileStepper } from "./LessonMobileStepper";
import { LessonAiHelpBlock } from "./LessonAiHelpBlock";
import { CURATED_ROADMAP_LESSON_ID, isCuratedRoadmapClosingStep } from "./curated-unit1-roadmap-steps";
import { RoadmapWorkspaceBody } from "./roadmap-workspace-body";
import {
  CURATED_WELCOME_LESSON_ID,
  isCuratedWelcomeClosingStep,
} from "./curated-unit1-welcome-steps";
import { WelcomePremiumBody, welcomeStepTitleClass } from "./welcome-premium-body";
import { buildLessonSteps, type UnifiedFlowItem, type BuiltWorkspaceStep } from "./workspace-step";
import { useWorkspaceState } from "./use-workspace-state";
import type { SidebarNextLessonProps } from "@/lib/amirant-course";
import { cn } from "@/lib/design-system/cn";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";

type Props = {
  lessonId: string;
  title: string;
  kindLabel: string;
  estimatedMinutes: number | null;
  intro: string;
  flow: UnifiedFlowItem[];
  mode: "markdown" | "blocks" | "vocab";
  vocabData?: VocabParseResult;
  practiceHref: string | null;
  quizHref: string | null;
  nextLessonHref: string | null;
  nextLessonTitle: string | null;
  courseHomeHref: string;
  defaultIntroFallback: string;
  sidebarNextLesson?: SidebarNextLessonProps | null;
};

/**
 * Right sidebar (steps) + center (single active block) + bottom nav; RTL-first.
 */
export function PremiumLessonWorkspace({
  lessonId,
  title,
  kindLabel,
  estimatedMinutes,
  intro,
  flow,
  mode,
  vocabData,
  practiceHref,
  quizHref,
  nextLessonHref,
  nextLessonTitle,
  courseHomeHref,
  defaultIntroFallback,
  sidebarNextLesson,
}: Props) {
  const [outlineOpen, setOutlineOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const stepBlockRef = useRef<HTMLDivElement>(null);
  const scrollPrevRef = useRef<{ lesson: string; step: number } | null>(null);

  useEffect(() => {
    if (!outlineOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOutlineOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [outlineOpen]);
  const steps = useMemo(
    () => buildLessonSteps(flow, { mode, lessonId, intro }),
    [flow, mode, lessonId, intro],
  );
  const n = steps.length;
  const { activeIndex, completedIndices, next, prev, selectStep, progressPercent } = useWorkspaceState(lessonId, steps);
  const firstGateIndex = useMemo(() => flow.findIndex((f) => f.kind === "gate"), [flow]);
  const current: BuiltWorkspaceStep | undefined = steps[activeIndex];

  useEffect(() => {
    const el = stepBlockRef.current;
    const was = scrollPrevRef.current;
    scrollPrevRef.current = { lesson: lessonId, step: activeIndex };
    if (!el || !was) return;
    if (was.lesson === lessonId && was.step === activeIndex) return;
    el.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeIndex, lessonId, prefersReducedMotion]);

  // Notify the floating chat panel whenever the active step changes so it knows what's on screen
  useEffect(() => {
    if (!current?.card?.body?.trim()) return;
    const plain = markdownishToPlain(current.card.body, 800).trim();
    if (!plain) return;
    dispatchAmirantQuestionContext({
      questionText: plain,
      topic: current.label,
      lessonId,
    });
  }, [activeIndex, lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onInteractionContinue = useCallback(() => {
    if (activeIndex < n - 1) {
      next();
    }
  }, [activeIndex, n, next]);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < n - 1;
  const isLast = activeIndex >= n - 1;

  if (!current || n < 1) {
    return null;
  }

  const mainInner = renderStepBody({
    current,
    mode,
    vocabData,
    title,
    intro,
    defaultIntroFallback,
    estimatedMinutes,
    flow,
    firstGateIndex,
    onInteractionContinue,
    courseHomeHref,
    practiceHref,
    quizHref,
    nextLessonHref,
    nextLessonTitle,
    lessonId,
  });

  return (
    <div className={cn(lessonSaaS.pageWrap, lessonSaaS.workspaceFull, "w-full max-w-none")}>
      {/* השיעור בגדול במרכז הדף; התפריט - drawer שנפתח מימין בכל הגדלים */}
      <div className="w-full max-w-none pb-4 sm:pb-6" dir="rtl" lang="he">
        {outlineOpen ? (
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="תוכנית הקורס"
            dir="rtl"
            lang="he"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
              aria-label="סגור"
              onClick={() => setOutlineOpen(false)}
            />
            <div className="absolute start-0 top-0 flex h-full w-[min(100%,24rem)] max-w-full shadow-2xl">
              <CourseOutlineSidebar
                lessonId={lessonId}
                courseHomeHref={courseHomeHref}
                steps={steps}
                activeIndex={activeIndex}
                completedIndices={completedIndices}
                onSelectStep={(i) => {
                  selectStep(i);
                  setOutlineOpen(false);
                }}
                nextInSequence={sidebarNextLesson}
                variant="drawer"
                onRequestClose={() => setOutlineOpen(false)}
                className="h-full max-h-[100dvh]"
              />
            </div>
          </div>
        ) : null}

        <main
          id="amirant-lesson-pulse"
          className="min-h-0 w-full min-w-0"
        >
          <div className="h-full w-full min-w-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
            <div className={cn(lessonSaaS.readingProse, "min-w-0")}>
              {/* טריגר תפריט מינימלי - לא תופס מקום */}
              <div className="sticky top-2 z-20 mb-4 flex justify-start">
                <button
                  type="button"
                  onClick={() => setOutlineOpen(true)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-200/90 bg-white/95 px-4 text-sm font-semibold text-[#0f2347] shadow-sm backdrop-blur-sm transition hover:border-[#0f2347]/25"
                  aria-haspopup="dialog"
                  aria-expanded={outlineOpen}
                >
                  <span aria-hidden>☰</span>
                  <span>תוכן הקורס</span>
                  <span className="tabular-nums text-slate-500">
                    {n > 0 ? `${activeIndex + 1}/${n}` : "-"}
                  </span>
                </button>
              </div>
              <LessonHeader
                className="mb-1 sm:mb-1.5"
                kindLabel={kindLabel}
                title={title}
                totalSteps={n}
                activeIndex={activeIndex}
                progressPercent={progressPercent}
                reducedMotion={prefersReducedMotion}
              />
              <div className="mb-1.5 flex justify-end sm:mb-2">
                <AmirantLessonTrackIsland lessonId={lessonId} lessonTitle={title} className="w-full sm:w-auto" />
              </div>
              <LessonMobileStepper
                className="mb-1.5 max-lg:mt-0 lg:mb-2"
                steps={steps}
                activeIndex={activeIndex}
                onSelect={selectStep}
              />
              <div className="min-w-0 space-y-3 [direction:rtl] sm:space-y-3.5">
                <div
                  ref={stepBlockRef}
                  id="amirant-step-viewport"
                  className="min-w-0 scroll-mt-4"
                >
                  <div
                    key={`${lessonId}-${activeIndex}`}
                    className={cn(
                      "min-w-0 will-change-transform",
                      !prefersReducedMotion && "animate-lesson-step-in",
                    )}
                  >
                    {mainInner}
                  </div>
                </div>
                <LessonNavigationFooter
                  className="mt-2 sm:mt-3"
                  canPrev={canPrev}
                  canNext={canNext}
                  isLast={isLast}
                  onPrev={prev}
                  onNext={next}
                  practiceHref={practiceHref}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

type RenderParams = {
  current: BuiltWorkspaceStep;
  mode: "markdown" | "blocks" | "vocab";
  vocabData?: VocabParseResult;
  title: string;
  intro: string;
  defaultIntroFallback: string;
  estimatedMinutes: number | null;
  flow: UnifiedFlowItem[];
  firstGateIndex: number;
  onInteractionContinue: () => void;
  courseHomeHref: string;
  practiceHref: string | null;
  quizHref: string | null;
  nextLessonHref: string | null;
  nextLessonTitle: string | null;
  lessonId: string;
};

function renderStepBody(p: RenderParams) {
  const c = p.current;
  if (c.kind === "inline_questions" && c.questions) {
    return (
      <LessonStepContent kind="inline_questions" showTopLabel={false} className="!min-h-0">
        <AmirantInlineQuestionsCard
          title={c.questions.title}
          questionIds={c.questions.questionIds}
          timeLimitSec={c.questions.timeLimitSec}
          sessionLabel={p.title}
        />
      </LessonStepContent>
    );
  }
  if (p.mode === "vocab" && c.id === "ws-intro") {
    return (
      <LessonStepContent kind="intro">
        <LessonHeroCard
          title={p.title}
          intro={p.intro}
          defaultIntroFallback={p.defaultIntroFallback}
          estimatedMinutes={p.estimatedMinutes}
          showFlowControls={false}
          started
          viewAll={false}
          onStart={() => undefined}
          onToggleViewAll={() => undefined}
          surface="workspace"
          omitTitle
        />
      </LessonStepContent>
    );
  }
  if (p.mode === "vocab" && c.id === "ws-vocab" && p.vocabData) {
    return (
      <LessonStepContent kind="explanation" className="!min-h-0">
        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white [direction:rtl]">
          <VocabularyLessonExperience
            data={p.vocabData}
            lessonId={p.lessonId}
            title={p.title}
            estimatedMinutes={p.estimatedMinutes}
          />
        </div>
      </LessonStepContent>
    );
  }
  if (c.kind === "intro") {
    return (
      <LessonStepContent kind="intro">
        <LessonHeroCard
          title={p.title}
          intro={p.intro}
          defaultIntroFallback={p.defaultIntroFallback}
          estimatedMinutes={p.estimatedMinutes}
          showFlowControls={false}
          started
          viewAll={false}
          onStart={() => undefined}
          onToggleViewAll={() => undefined}
          surface="workspace"
          omitTitle
        />
      </LessonStepContent>
    );
  }
  if (p.lessonId === CURATED_WELCOME_LESSON_ID && c.welcome && p.mode === "markdown" && c.kind === "summary" && isCuratedWelcomeClosingStep(c.id)) {
    return (
      <LessonStepContent kind="summary" showTopLabel={false} className="!min-h-0">
        <div className={lessonSaaS.stepReadingSurface}>
          <p className={lessonSaaS.eyebrowGuided}>סיכום והמשך</p>
          <h2 className={cn(welcomeStepTitleClass(), "mt-2 text-pretty [text-wrap:balance]")}>
            {c.label}
          </h2>
          <div className="mt-3 w-full min-w-0 sm:mt-4">
            <WelcomePremiumBody
              payload={c.welcome}
              stepId={c.id}
              onInteractionContinue={p.onInteractionContinue}
              embedQuickCheck={Boolean(c.embedQuickCheck)}
              firstGateIndex={p.firstGateIndex}
              flowIndex={c.flowIndex}
            />
          </div>
          <div className="mt-6 space-y-5 border-t border-stone-100 pt-5">
            <LessonAiHelpBlock />
            <LessonFooterCTA
              courseHomeHref={p.courseHomeHref}
              practiceHref={p.practiceHref}
              quizHref={p.quizHref}
              nextLessonHref={p.nextLessonHref}
              nextLessonTitle={p.nextLessonTitle}
              surface="embed"
            />
          </div>
        </div>
      </LessonStepContent>
    );
  }
  if (p.lessonId === CURATED_WELCOME_LESSON_ID && c.welcome && p.mode === "markdown" && c.kind !== "summary") {
    const k = asContentStepKind(c.kind);
    return (
      <LessonStepContent kind={k} showTopLabel={false} className="!min-h-0">
        <div className={lessonSaaS.stepReadingSurface}>
          <p className={lessonSaaS.eyebrowGuided}>למידה מודרכת</p>
          <h2 className={cn(welcomeStepTitleClass(), "mt-2 text-pretty [text-wrap:balance]")}>
            {c.label}
          </h2>
          <div className="mt-3 w-full min-w-0 sm:mt-4">
            <WelcomePremiumBody
              payload={c.welcome}
              stepId={c.id}
              onInteractionContinue={p.onInteractionContinue}
              embedQuickCheck={Boolean(c.embedQuickCheck)}
              firstGateIndex={p.firstGateIndex}
              flowIndex={c.flowIndex}
            />
          </div>
        </div>
      </LessonStepContent>
    );
  }
  if (p.lessonId === CURATED_ROADMAP_LESSON_ID && c.roadmap && (c.id === "curated-roadmap-structure" || c.id === "curated-roadmap-plan6")) {
    const k = asContentStepKind(c.kind);
    return (
      <LessonStepContent kind={k} showTopLabel={false} className="!min-h-0">
        <div className={lessonSaaS.stepReadingSurface}>
          <p className={lessonSaaS.eyebrowGuided}>למידה מודרכת</p>
          <h2
            className={cn(
              "text-2xl font-semibold text-[#0f2347] sm:text-3xl",
              "mt-2 text-pretty [text-wrap:balance] [text-align:start] leading-tight",
            )}
          >
            {c.label}
          </h2>
          <div className="mt-3 sm:mt-4">
            <RoadmapWorkspaceBody
              mode={c.id === "curated-roadmap-structure" ? "structure" : "plan6"}
              payload={c.roadmap}
            />
          </div>
        </div>
      </LessonStepContent>
    );
  }
  if (c.kind === "summary" && (isCuratedWelcomeClosingStep(c.id) || isCuratedRoadmapClosingStep(c.id))) {
    const closingCard = c.card;
    const isRoadmapClose = isCuratedRoadmapClosingStep(c.id);
    const stripTitle = isRoadmapClose ? "הצעד הבא" : "סיכום והמשך";
    const eyebrow = isRoadmapClose ? "המשך במסלול" : "סיכום והמשך";
    const h2 = isRoadmapClose ? "הצעד הבא" : "סיכום והמשך";
    const bodyClosing = closingCard?.body
      ? stripLeadingDuplicateSectionHeading(closingCard.body, stripTitle) ?? closingCard.body
      : undefined;
    return (
      <LessonStepContent kind="summary" showTopLabel={false} className="!min-h-0">
        <div className={lessonSaaS.stepReadingSurface}>
          <p className={lessonSaaS.eyebrowGuided}>{eyebrow}</p>
          <h2 className={cn(lessonSaaS.h2Step, "mt-2 text-pretty [text-wrap:balance]")}>{h2}</h2>
          {bodyClosing?.trim() && closingCard ? (
            <div className={cn("mt-3 sm:mt-4", lessonSaaS.stepInsightShort)}>
              <LessonBlockCard
                key={closingCard.key}
                title={h2}
                variant={closingCard.variant}
                body={bodyClosing}
                contentMode="workspaceFlat"
              />
            </div>
          ) : (
            <div className="mt-4">
              <LessonKeyTakeawayClosing surface="embed" />
            </div>
          )}
          <div className="mt-6 space-y-5 border-t border-stone-100 pt-5">
            <LessonAiHelpBlock />
            <LessonFooterCTA
              courseHomeHref={p.courseHomeHref}
              practiceHref={p.practiceHref}
              quizHref={p.quizHref}
              nextLessonHref={p.nextLessonHref}
              nextLessonTitle={p.nextLessonTitle}
              surface="embed"
              emphasizeNext
            />
          </div>
        </div>
      </LessonStepContent>
    );
  }
  // רק צעד הסיכום האוטומטי (בלי כרטיס תוכן); סקשן אמיתי בסגנון key-takeaway
  // חייב ליפול לענף c.card - אחרת גוף הסקשן (למשל טבלת הערכה עצמית) נעלם.
  if (c.kind === "summary" && !c.card) {
    return (
      <LessonStepContent kind="summary" className="!min-h-0">
        <LessonKeyTakeawayClosing surface="embed" />
      </LessonStepContent>
    );
  }
  if (c.kind === "ai_help") {
    return (
      <LessonStepContent kind="ai_help">
        <LessonAiHelpBlock />
      </LessonStepContent>
    );
  }
  if (c.kind === "practice_cta") {
    return (
      <LessonStepContent kind="practice_cta" className="!min-h-0">
        <LessonFooterCTA
          courseHomeHref={p.courseHomeHref}
          practiceHref={p.practiceHref}
          quizHref={p.quizHref}
          nextLessonHref={p.nextLessonHref}
          nextLessonTitle={p.nextLessonTitle}
          surface="embed"
        />
      </LessonStepContent>
    );
  }
  if (c.kind === "quick_check" && c.flowIndex != null) {
    const isFirstGate = p.firstGateIndex === c.flowIndex;
    return (
      <LessonStepContent kind="quick_check" className="!min-h-0">
        <div className="space-y-5 sm:space-y-6">
          <LessonInteractionBlock onContinue={p.onInteractionContinue} surface="embed" />
          {isFirstGate ? <LessonAiBlock /> : null}
        </div>
      </LessonStepContent>
    );
  }
  if (c.card) {
    const card = c.card;
    const k = asContentStepKind(c.kind);
    const stepTitle = c.label;
    let bodyForDisplay =
      stripLeadingDuplicateSectionHeading(card.body, card.stepLabel) ?? card.body ?? "";
    bodyForDisplay = stripLeadingDuplicateSectionHeading(bodyForDisplay, stepTitle) ?? bodyForDisplay;
    bodyForDisplay = stripEdgeSeparatorNoise(
      stripTakeawayBlocksFromBody(bodyForDisplay) ?? bodyForDisplay,
    );
    const plainFull = markdownishToPlain(bodyForDisplay ?? "", 20_000).trim();
    const isShort = plainFull.length > 0 && plainFull.length < 420;
    const isKeyTakeaway = card.variant === "key-takeaway";
    const hasExplicitTakeaway = /מ\s*ה\s*ל[קק]חת\s*מזה|מה\s*ל[קק]חת\s*מזה/i.test(plainFull);
    const takeaway = takeawayLineFromLessonBody(bodyForDisplay);
    const showTakeaway =
      Boolean(takeaway) &&
      plainFull.length >= 160 &&
      takeaway!.trim() !== plainFull.trim() &&
      !hasExplicitTakeaway;

    return (
      <LessonStepContent kind={k} showTopLabel={false} className="!min-h-0">
        <div
          className={cn(
            lessonSaaS.stepReadingSurface,
            isKeyTakeaway && "border-s-[3px] border-s-sky-700/85 border-stone-200/90 ps-4 sm:ps-5",
          )}
        >
          <p className={lessonSaaS.eyebrowGuided}>למידה מודרכת</p>
          <h2 className={cn(lessonSaaS.h2Step, "mt-2 text-pretty [text-wrap:balance]")}>{stepTitle}</h2>
          <div
            className={cn(
              "mt-3 sm:mt-4",
              isShort && lessonSaaS.stepInsightShort,
            )}
          >
            <LessonBlockCard
              key={card.key}
              title={stepTitle}
              variant={card.variant}
              body={bodyForDisplay}
              items={card.items}
              bullets={card.bullets}
              contentMode="workspaceFlat"
            />
          </div>
          {showTakeaway ? (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-sm leading-relaxed text-[#0f2347] sm:text-[0.9375rem]">
                <span className="font-semibold text-sky-900">מה לקחת מזה: </span>
                {takeaway}
              </p>
            </div>
          ) : null}
          {c.embedQuickCheck && c.flowIndex != null ? (
            <div className="mt-6 space-y-5 border-t border-stone-100 pt-5">
              <LessonInteractionBlock onContinue={p.onInteractionContinue} surface="embed" />
              {p.firstGateIndex === c.flowIndex ? <LessonAiBlock /> : null}
            </div>
          ) : null}
        </div>
      </LessonStepContent>
    );
  }
  return <p className="text-base text-slate-500 [direction:rtl] sm:text-lg">אין תצוגה לשלב הזה.</p>;
}

function asContentStepKind(
  k: BuiltWorkspaceStep["kind"],
): "explanation" | "example" | "tip" | "warning" {
  if (k === "example" || k === "tip" || k === "warning" || k === "explanation") {
    return k;
  }
  if (k === "summary" || k === "quick_check") {
    return "explanation";
  }
  return "explanation";
}
