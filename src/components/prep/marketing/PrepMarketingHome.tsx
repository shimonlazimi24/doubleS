import { AIValueSection } from "@/components/prep/marketing/AIValueSection";
import { CTASection } from "@/components/prep/marketing/CTASection";
import { ExamStructureTable } from "@/components/prep/marketing/ExamStructureCards";
import { HeroSection } from "@/components/prep/marketing/HeroSection";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { Container } from "@/components/ui";
import {
  EXAM_STRUCTURE,
  HOW_IT_WORKS,
  WHAT_YOU_GET,
  WHY_IT_MATTERS,
} from "@/lib/prep/marketing/content";

/**
 * דף הבית בשפה עריכתית: לכל סקשן צורה משלו (טבלת מפרט, מסלול ממוספר,
 * רשימות קו-שיער) - בלי גריד כרטיסיות אחיד שחוזר על עצמו ובלי רווחי ענק.
 */
export function PrepMarketingHome() {
  return (
    <>
      <HeroSection />

      {/* למה זה חשוב - כותרת בצד, שלוש נקודות כרשימה שטוחה */}
      <section id="why" className="border-t border-line/70 bg-paper py-10 md:py-14">
        <Container max="shell">
          <div className="grid gap-6 lg:grid-cols-[minmax(13rem,17rem)_1fr] lg:gap-12">
            <header className="text-right">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                לפני התואר
              </p>
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-ink md:text-3xl">
                {WHY_IT_MATTERS.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {WHY_IT_MATTERS.subtitle}
              </p>
            </header>
            <ul className="self-center">
              {WHY_IT_MATTERS.items.map((item) => (
                <li
                  key={item.title}
                  className="border-t border-line/70 py-3.5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <p className="text-base leading-relaxed text-ink">
                    <span className="font-semibold">{item.title}.</span>{" "}
                    <span className="text-muted">{item.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* מסלול הלמידה - ארבעה צעדים על קו, לא קופסאות */}
      <MarketingSection
        id="how"
        eyebrow="מסלול הלמידה"
        title={HOW_IT_WORKS.title}
        subtitle={HOW_IT_WORKS.subtitle}
        tone="canvas"
      >
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.steps.map((step) => (
            <li key={step.step} className="border-t-2 border-primary/15 pt-3 text-right">
              <span className="font-mono text-sm font-semibold tabular-nums text-accent">
                {step.step}
              </span>
              <h3 className="mt-1.5 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      {/* מבנה המבחן - מפרט עובדתי בשורות, כמו דף מידע רשמי */}
      <MarketingSection
        id="exam"
        eyebrow="אמירנט"
        title={EXAM_STRUCTURE.title}
        subtitle={EXAM_STRUCTURE.subtitle}
        tone="paper"
      >
        <ExamStructureTable />
      </MarketingSection>

      {/* מה מקבלים - רשימת "כלול בקורס" בשתי עמודות, בלי כרטיסים */}
      <MarketingSection
        id="includes"
        eyebrow="בתוך הפלטפורמה"
        title={WHAT_YOU_GET.title}
        subtitle={WHAT_YOU_GET.subtitle}
        tone="canvas"
      >
        <ul className="grid max-w-4xl gap-x-10 sm:grid-cols-2">
          {WHAT_YOU_GET.features.map((f) => (
            <li key={f.title} className="border-t border-line/70 py-3.5">
              <p className="text-base leading-relaxed text-ink">
                <span className="font-semibold">{f.title}.</span>{" "}
                <span className="text-muted">{f.body}</span>
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <AIValueSection />

      {/* קטלוג הקורסים הוסר מדף הבית (תמונות סטוק, קורס אחד חי) - נשאר ב-/prep/courses;
          יוחזר כשיהיו כמה קורסים חיים עם ויז'ואלים אמיתיים */}

      <CTASection />
    </>
  );
}
