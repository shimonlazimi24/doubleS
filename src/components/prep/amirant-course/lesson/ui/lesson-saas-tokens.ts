/**
 * Amirant lesson - premium SaaS surface (2026). Single source for card + type scale.
 */
export const lessonSaaS = {
  /** Full-bleed workspace - קנבס לבן אחיד: התוכן ישירות על הדף, בלי קופסה עוטפת. */
  pageWrap: "min-h-[50vh] [direction:rtl] [text-align:start] bg-white",
  /** Legacy centered shell (e.g. marketing blocks). */
  container: "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8",
  /** Full-width lesson workspace - no centering, no max-width on the shell. */
  workspaceFull: "w-full max-w-none [direction:rtl] [text-align:start]",
  /** השיעור בגדול במרכז הדף - עמודת קריאה ממורכזת. */
  readingProse: "w-full max-w-[min(54rem,100%)] mx-auto",
  sectionGap: "space-y-8 sm:space-y-10",
  contentGap: "space-y-6 sm:space-y-8",
  blockGap: "space-y-6 sm:space-y-8",
  card:
    "rounded-2xl border border-line bg-paper p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8",
  cardMuted: "rounded-2xl border border-line/90 bg-surface-low/40 p-6 shadow-sm sm:p-8",
  h1: "text-3xl font-semibold leading-[1.2] tracking-tight text-primary sm:text-4xl sm:leading-[1.15]",
  /** Step title in guided workspace (matches premium scale: 2xl → 3xl) */
  h2Step: "text-2xl font-semibold leading-snug tracking-tight text-primary sm:text-3xl",
  h2: "text-2xl font-semibold leading-snug text-primary sm:text-3xl",
  h3: "text-xl font-semibold text-primary sm:text-xl",
  eyebrow: "text-xs font-medium uppercase tracking-wide text-muted sm:text-sm",
  /** Guided step chrome */
  eyebrowGuided: "text-[11px] font-semibold uppercase tracking-[0.12em] text-accent sm:text-xs",
  body: "text-lg leading-8 text-muted sm:text-lg",
  bodySm: "text-sm leading-relaxed text-muted sm:text-base",
  divider: "my-6 border-0 border-t border-line",
  /** Step body: no extra wrapper - padding comes from the workspace main column. */
  stepContent: "min-h-0 border-0 bg-transparent p-0 shadow-none [direction:rtl] [text-align:start]",
  progressBarTrack: "h-1.5 w-full overflow-hidden rounded-full bg-surface-high",
  progressBarFill: "h-full rounded-full bg-accent transition-[width] duration-500 ease-out",
  /** משטח צעד שטוח - בלי כרטיסייה עוטפת (cards-in-cards מסבך ולא נקי). */
  stepReadingSurface: "border-0 bg-transparent p-0 shadow-none ring-0",
  /** תוכן קצר נשאר שטוח - קופסה אפורה סביב שתי שורות היא "כרטיסייה בתוך כרטיסייה" (משוב). */
  stepInsightShort: "",
} as const;
