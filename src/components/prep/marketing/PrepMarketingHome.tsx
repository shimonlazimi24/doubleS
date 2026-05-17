import { PrepCourseCatalog } from "@/components/prep/catalog/PrepCourseCatalog";
import { AIValueSection } from "@/components/prep/marketing/AIValueSection";
import { CTASection } from "@/components/prep/marketing/CTASection";
import { ExamStructureCards } from "@/components/prep/marketing/ExamStructureCards";
import { FeatureCard } from "@/components/prep/marketing/FeatureCard";
import { HeroSection } from "@/components/prep/marketing/HeroSection";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import {
  EXAM_STRUCTURE,
  HOW_IT_WORKS,
  WHAT_YOU_GET,
  WHY_IT_MATTERS,
} from "@/lib/prep/marketing/content";

function StepIcon({ step }: { step: string }) {
  return (
    <span className="font-mono text-sm font-semibold tabular-nums text-accent">{step}</span>
  );
}

export function PrepMarketingHome() {
  return (
    <>
      <HeroSection />

      <MarketingSection
        id="why"
        eyebrow="לפני התואר"
        title={WHY_IT_MATTERS.title}
        subtitle={WHY_IT_MATTERS.subtitle}
        tone="paper"
      >
        <ul className="grid gap-5 md:grid-cols-3">
          {WHY_IT_MATTERS.items.map((item) => (
            <li key={item.title}>
              <FeatureCard title={item.title} body={item.body} />
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection
        id="how"
        eyebrow="מסלול הלמידה"
        title={HOW_IT_WORKS.title}
        subtitle={HOW_IT_WORKS.subtitle}
        tone="canvas"
      >
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.steps.map((step) => (
            <li
              key={step.step}
              className="rounded-surface border border-line/80 bg-paper p-6 shadow-card"
            >
              <StepIcon step={step.step} />
              <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection
        id="exam"
        eyebrow="אמירנט"
        title={EXAM_STRUCTURE.title}
        subtitle={EXAM_STRUCTURE.subtitle}
        tone="paper"
      >
        <ExamStructureCards />
      </MarketingSection>

      <MarketingSection
        id="includes"
        eyebrow="בתוך הפלטפורמה"
        title={WHAT_YOU_GET.title}
        subtitle={WHAT_YOU_GET.subtitle}
        tone="canvas"
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHAT_YOU_GET.features.map((f) => (
            <li key={f.title}>
              <FeatureCard title={f.title} body={f.body} />
            </li>
          ))}
        </ul>
      </MarketingSection>

      <AIValueSection />

      <PrepCourseCatalog id="limudim" />

      <CTASection />
    </>
  );
}
