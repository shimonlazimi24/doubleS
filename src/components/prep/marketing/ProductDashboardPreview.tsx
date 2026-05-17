const MODULES = [
  { label: "מבוא ומבנה המבחן", pct: 100, status: "הושלם" },
  { label: "אוצר מילים אקדמי", pct: 62, status: "בתהליך" },
  { label: "השלמת משפטים", pct: 38, status: "בתהליך" },
  { label: "הבנת הנקרא", pct: 12, status: "הבא" },
] as const;

const STATS = [
  { label: "התקדמות כללית", value: "48%" },
  { label: "שיעורים שהושלמו", value: "12" },
  { label: "ממוצע תרגול", value: "74" },
] as const;

const BARS = [42, 68, 55, 74, 61, 80, 48] as const;

export function ProductDashboardPreview() {
  return (
    <div
      className="relative w-full max-w-[28rem] justify-self-end lg:max-w-none"
      aria-hidden={false}
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-[1.75rem] bg-gradient-to-br from-accent/15 via-transparent to-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-paper shadow-preview">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-line/80 bg-surface-low/80 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </div>
          <p className="text-[0.6875rem] font-medium text-muted">אמירנט · לוח תלמיד</p>
          <span className="rounded-md bg-accent-muted px-2 py-0.5 text-[0.625rem] font-semibold text-accent">
            Live
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[7.5rem_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-e border-line/60 bg-primary/[0.03] p-3 lg:block">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">מודולים</p>
            <ul className="mt-3 space-y-2">
              {MODULES.map((m, i) => (
                <li
                  key={m.label}
                  className={`rounded-md px-2 py-1.5 text-[0.6875rem] leading-tight ${
                    i === 1 ? "bg-primary text-paper font-medium" : "text-muted"
                  }`}
                >
                  {m.label.split(" ")[0]}…
                </li>
              ))}
            </ul>
          </aside>

          <div className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-accent">מסלול אמירנט</p>
                <p className="mt-0.5 text-base font-semibold text-ink">סיכום התקדמות</p>
              </div>
              <p className="rounded-lg bg-primary-muted px-2.5 py-1 text-xs font-semibold text-primary">
                שבוע 3
              </p>
            </div>

            <ul className="mt-4 grid grid-cols-3 gap-2">
              {STATS.map((s) => (
                <li key={s.label} className="rounded-lg border border-line/70 bg-canvas px-2.5 py-2">
                  <p className="text-lg font-semibold tabular-nums text-ink">{s.value}</p>
                  <p className="text-[0.625rem] leading-tight text-muted">{s.label}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-line/70 bg-canvas p-3">
              <p className="mb-2 text-[0.6875rem] font-medium text-muted">ביצועים בתרגול (7 ימים)</p>
              <div className="flex h-14 items-end gap-1" aria-hidden>
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-primary to-accent opacity-90"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <ul className="mt-4 space-y-3">
              {MODULES.map((m) => (
                <li key={m.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-[0.8125rem]">
                    <span className="font-medium text-ink">{m.label}</span>
                    <span className="text-muted">{m.status}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-low">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-accent to-primary"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
