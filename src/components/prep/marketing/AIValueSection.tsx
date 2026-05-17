import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { AI_VALUE } from "@/lib/prep/marketing/content";

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
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ul className="space-y-4">
          {content.points.map((point) => (
            <li
              key={point}
              className="flex gap-3 rounded-surface border border-line/80 bg-paper px-5 py-4 shadow-card"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent"
                aria-hidden
              >
                ✓
              </span>
              <span className="text-sm leading-relaxed text-ink md:text-base">{point}</span>
            </li>
          ))}
        </ul>
        <aside className="rounded-surface border border-primary/15 bg-primary p-6 text-paper shadow-lift md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">בתוך הקורס</p>
          <p className="mt-4 text-base leading-relaxed text-slate-200">{content.note}</p>
          <div className="mt-6 rounded-control border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p className="font-medium text-paper">דוגמה לשימוש</p>
            <p className="mt-2 leading-relaxed">
              אחרי מבחן תרגול — סיכום נקודות לחיזוק והמלצה על יחידות להמשך, לפי הביצועים שלכם.
            </p>
          </div>
        </aside>
      </div>
    </MarketingSection>
  );
}
