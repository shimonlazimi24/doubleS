import type { ReactNode } from "react";
import { PremiumMarkdownBody } from "../premium/PremiumMarkdownBody";
import { cn } from "@/lib/design-system/cn";
import type { WelcomeStepPayload } from "@/lib/amirant-course/lesson-content/welcome-premium-extract";
import { isCuratedWelcomeExamIntroStep } from "./curated-unit1-welcome-steps";
import { LessonInteractionBlock } from "../lesson/LessonInteractionBlock";
import { LessonAiBlock } from "../lesson/LessonAiBlock";
import { amirantPremiumTypo } from "../lesson/amirant-premium-typography";
import {
  ChecklistBlock,
  CourseIncludesGrid,
  ExamScoreBulletCards,
  ExamStructureCards,
  LearningHighlight,
  ScoreRangeCards,
  StudyPlanCards,
} from "../lesson/premium-content-blocks";

const surface = cn(amirantPremiumTypo.readingSurface, "space-y-6");

function IntroTextBlock({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(amirantPremiumTypo.body, className)}>{children}</div>;
}

const examMeta = amirantPremiumTypo.meta;
const h3 = amirantPremiumTypo.sectionTitle;
const nameCard = "rounded-2xl border border-stone-200/85 bg-white p-5 [direction:rtl] [text-align:start] sm:p-6";
const reformShell =
  "space-y-3 rounded-2xl border border-sky-100/80 bg-stone-50/50 p-5 [text-align:start] sm:p-6";

type ExamishProps = {
  stepId: string;
  data: import("@/lib/amirant-course/lesson-content/welcome-premium-extract").ExamPremiumData;
  embedQuickCheck: boolean;
  firstGate: boolean;
  onContinue: () => void;
};

function ExamBlock({ data, stepId, embedQuickCheck, firstGate, onContinue }: ExamishProps) {
  return (
    <div className="space-y-5 [direction:rtl] [text-align:start]">
      {data.lede ? (
        <IntroTextBlock>
          <PremiumMarkdownBody
            body={data.lede}
            variant="lesson"
            className="[&_a]:text-sky-800"
          />
        </IntroTextBlock>
      ) : null}
      <div className={nameCard}>
        <p className={examMeta}>{data.nameLabel}</p>
        <p className="mt-1.5 text-lg leading-8 text-slate-800 [text-align:start] [text-wrap:pretty]">
          <PremiumMarkdownBody body={data.nameText} variant="lesson" className="!inline max-w-none [&_p]:!inline" />
        </p>
      </div>
      <div>
        <h3 className={h3}>{data.structureTitle}</h3>
        <ul className="mt-2.5 space-y-2" role="list">
          {data.structureBullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-lg leading-8 text-slate-800 [text-align:start] [text-wrap:pretty]">
              <span className="text-sky-700" aria-hidden>
                ·
              </span>
              <span className="min-w-0">
                {b.startsWith("**") || b.includes("**") ? (
                  <PremiumMarkdownBody body={b} variant="lesson" className="!inline" />
                ) : (
                  b
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className={cn("mt-3", examMeta)}>{data.durationLine}</p>
      </div>
      <ExamStructureCards title={data.questionTableTitle} rows={data.questionRows} />
      <ExamScoreBulletCards title={data.scoreTitle} bullets={data.scoreBullets} />
      {data.adaptiveText ? (
        <div>
          <h3 className={h3}>{data.adaptiveTitle}</h3>
          <p className="mt-2 text-lg leading-8 text-slate-700 [text-align:start] [text-wrap:pretty]">{data.adaptiveText}</p>
        </div>
      ) : null}
      {data.reform ? (
        <div className={reformShell}>
          <h3 className="text-lg font-semibold text-[#0f2347] sm:text-xl">{data.reform.title}</h3>
          <p className="text-sm font-medium text-slate-700 [text-align:start]">{data.reform.p1Label}</p>
          <div className="text-base leading-7 text-slate-800 [text-align:start] sm:text-lg sm:leading-8">
            <PremiumMarkdownBody body={data.reform.p1Text} variant="lesson" />
          </div>
          <p className="pt-1 text-sm font-medium text-slate-700 [text-align:start]">{data.reform.p2Label}</p>
          <div className="text-base leading-7 text-slate-800 [text-align:start] sm:text-lg sm:leading-8">
            <PremiumMarkdownBody body={data.reform.p2Text} variant="lesson" />
          </div>
          <p className={cn("pt-1", examMeta)}>{data.reform.p3}</p>
        </div>
      ) : null}
      {embedQuickCheck && isCuratedWelcomeExamIntroStep(stepId) ? (
        <div className="space-y-4 border-t border-stone-100 pt-5">
          <LessonInteractionBlock onContinue={onContinue} surface="embed" />
          {firstGate ? <LessonAiBlock /> : null}
        </div>
      ) : null}
    </div>
  );
}

type WProps = {
  payload: WelcomeStepPayload;
  stepId: string;
  onInteractionContinue: () => void;
  embedQuickCheck: boolean;
  firstGateIndex: number;
  flowIndex: number | null;
};

/**
 * Curated `lesson.intro.welcome` body — no generic markdown wall; no duplicate «מה לקחת מזה».
 */
export function WelcomePremiumBody({ payload, stepId, onInteractionContinue, embedQuickCheck, firstGateIndex, flowIndex }: WProps) {
  switch (payload.step) {
    case "open": {
      const d = payload.data;
      return (
        <div className={cn(surface, "space-y-5")}>
          <IntroTextBlock>
            <PremiumMarkdownBody body={d.intro} variant="lesson" className="[&_p]:!text-lg [&_p]:!leading-8" />
          </IntroTextBlock>
          {d.highlight ? <LearningHighlight text={d.highlight} /> : null}
        </div>
      );
    }
    case "why": {
      const d = payload.data;
      return (
        <div className={cn(surface, "space-y-5")}>
          <IntroTextBlock>
            <PremiumMarkdownBody body={d.lede} variant="lesson" />
          </IntroTextBlock>
          <ScoreRangeCards rows={d.scoreRows} />
          {d.goal ? (
            <KeyTakeawayLineFromWhy goal={d.goal} />
          ) : null}
        </div>
      );
    }
    case "what": {
      const d = payload.data;
      return <CourseIncludesGrid units={d.units} bonusTitle={d.bonusTitle} bonusItems={d.bonusItems} />;
    }
    case "commitment": {
      const d = payload.data;
      return (
        <div className={cn(surface, "space-y-6")}>
          {d.ourItems.length ? <ChecklistBlock title="המחויבות שלי אליכם" items={d.ourItems} asNumbers /> : null}
          {d.yoursLede ? (
            <IntroTextBlock>
              <PremiumMarkdownBody body={d.yoursLede} variant="lesson" />
            </IntroTextBlock>
          ) : null}
          <StudyPlanCards title={d.planTitle} options={d.planOptions} />
          {d.ironItems.length ? <ChecklistBlock title={d.ironTitle} items={d.ironItems} asNumbers /> : null}
        </div>
      );
    }
    case "success": {
      return (
        <div className={cn(surface, "space-y-3")}>
          {payload.data.rules.map((r) => (
            <div
              key={r.n}
              className="rounded-2xl border border-stone-200/80 bg-white p-4 [direction:rtl] [text-align:start] sm:p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">כלל {r.n} מתוך 5</p>
              <div className="mt-1.5 text-lg leading-8 text-slate-800 [text-wrap:pretty]">
                <PremiumMarkdownBody body={r.text} variant="lesson" className="[&_p]:!inline" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "exam": {
      return (
        <ExamBlock
          data={payload.data}
          stepId={stepId}
          embedQuickCheck={Boolean(embedQuickCheck)}
          firstGate={flowIndex != null && firstGateIndex === flowIndex}
          onContinue={onInteractionContinue}
        />
      );
    }
    case "closing": {
      const d = payload.data;
      return (
        <div className={cn(surface, "space-y-6")}>
          <div>
            <h3 className={h3}>{d.nextTitle}</h3>
            <ol className="mt-2.5 list-decimal space-y-2 pr-6 [text-align:start]">
              {d.nextItems.map((n, i) => (
                <li key={i} className="text-lg leading-8 text-slate-800 [text-align:start] [text-wrap:pretty]">
                  <PremiumMarkdownBody body={n} variant="lesson" className="!inline" />
                </li>
              ))}
            </ol>
          </div>
          {d.giftItems.length ? (
            <div>
              <h3 className={h3}>{d.giftTitle}</h3>
              <ul className="mt-2 space-y-2 [text-align:start]" role="list">
                {d.giftItems.map((g, j) => (
                  <li key={j} className="text-lg leading-7 text-slate-800 [text-align:start] [text-wrap:pretty]">
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {d.closing ? (
            <p className="pt-1 text-lg font-medium leading-8 text-[#0f2347] [text-align:start] [text-wrap:pretty] sm:text-xl">
              {d.closing}
            </p>
          ) : null}
        </div>
      );
    }
    default:
      return null;
  }
}

function KeyTakeawayLineFromWhy({ goal }: { goal: string }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 px-4 py-3.5 [direction:rtl] [text-align:start] sm:px-5 sm:py-4">
      <PremiumMarkdownBody body={goal} variant="lesson" className="[&_p]:!text-base [&_p]:!leading-7 sm:[&_p]:!text-lg" />
    </div>
  );
}

export function welcomeStepTitleClass() {
  return amirantPremiumTypo.stepTitle;
}
