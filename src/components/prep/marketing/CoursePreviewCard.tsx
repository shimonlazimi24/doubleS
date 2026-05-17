const MODULES = [
  { label: "מבוא ומבנה המבחן", pct: 100 },
  { label: "אוצר מילים אקדמי", pct: 62 },
  { label: "השלמת משפטים", pct: 38 },
  { label: "הבנת הנקרא", pct: 12 },
] as const;

export function CoursePreviewCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-paper p-5 shadow-lift md:p-6">
      <div
        className="pointer-events-none absolute -start-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
        aria-hidden
      />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">תצוגה לדוגמה</p>
      <p className="mt-1 text-base font-semibold text-ink">דשבורד התקדמות — אמירנט</p>
      <ul className="mt-5 space-y-4">
        {MODULES.map((m) => (
          <li key={m.label}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-ink">{m.label}</span>
              <span className="tabular-nums text-muted">{m.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-low">
              <div
                className="h-full rounded-full bg-gradient-to-l from-accent to-primary transition-all"
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line/60 pt-4 text-xs text-muted">
        מעקב לפי מודולים, מבחנים ותרגול — אחרי התחברות.
      </p>
    </div>
  );
}
