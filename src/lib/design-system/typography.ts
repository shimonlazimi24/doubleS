/**
 * Typography roles - use via `<Text variant="…" />` or `<Heading level={n} />`.
 * Strong hierarchy: display > page title > section > body.
 */
export const typography = {
  /** Eyebrow / kicker */
  eyebrow: "text-xs font-semibold uppercase tracking-[0.16em] text-primary",

  /** Marketing hero (Hebrew; display serif) */
  displayHero:
    "font-display text-[2.25rem] font-semibold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl",

  /** Large section title (dominant) */
  headlineLg: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl",

  /** Standard section title */
  headline: "font-display text-2xl font-semibold leading-snug tracking-tight text-ink md:text-3xl",

  headlineSm: "font-display text-xl font-semibold leading-snug text-ink md:text-2xl",

  /** Inner page H1 */
  titlePage: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink md:text-[2.125rem]",

  /** Card / list titles */
  title: "font-display text-lg font-semibold leading-snug text-ink",

  bodyLg: "text-lg leading-body text-muted md:text-xl",

  body: "text-base leading-body text-muted",

  bodySm: "text-sm leading-body text-muted",

  labelAccent:
    "text-xs font-semibold uppercase tracking-[0.14em] text-primary transition group-hover:text-primary-hover",

  quote: "font-display text-xl font-normal leading-snug text-ink md:text-2xl",

  caption: "text-sm text-muted-2",

  /** On `bg-ink` / dark bands */
  bodyInverse: "text-base leading-body text-white/85",

  bodyInverseMuted: "text-sm leading-body text-white/70",
} as const;

export type TypographyRole = keyof typeof typography;
