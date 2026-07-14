import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { AI_VALUE } from "@/lib/prep/marketing/content";

/** שורות ✓ שטוחות + "הערת מורה" אחת (חתימת המותג) - בלי גלוסות ופאנלים כהים. */
export function AIValueSection() {
  const content = AI_VALUE;
  return (
    <MarketingSection
      id="ai-coach"
      eyebrow="ליווי חכם"
      title={content.title}
      subtitle={content.subtitle}
      tone="canvas"
    >
      <div className="grid max-w-4xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        <ul className="space-y-3">
          {content.points.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-1 font-bold text-accent" aria-hidden>
                ✓
              </span>
              <span className="text-sm leading-relaxed text-ink md:text-base">{point}</span>
            </li>
          ))}
          <li className="pt-2 text-xs leading-relaxed text-muted">{content.note}</li>
        </ul>

        <aside className="rounded-e-xl border-s-[3px] border-pen/70 bg-pen/[0.04] p-5">
          <p className="text-[11px] font-bold tracking-wide text-pen">כך זה נראה אחרי בוחן</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            «סיימתם בוחן ניסוח מחדש עם 7/10. הנקודה לחיזוק: משפטים שבהם המבנה משתנה אבל המשמעות
            נשמרת (שאלות 3 ו-8). מומלץ לחזור על שיטה 2 במדריך ולתרגל סט קצר של 6 שאלות.»
          </p>
          <p className="mt-3 text-xs text-muted">דוגמה להמלצה - הנוסח נבנה מהביצועים שלכם בפועל.</p>
        </aside>
      </div>
    </MarketingSection>
  );
}
