import type { Config } from "tailwindcss";

/** Theme maps to `src/styles/design-tokens.css`. */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        "muted-2": "var(--color-muted-2)",
        canvas: "var(--color-canvas)",
        "surface-low": "var(--color-surface-low)",
        "surface-high": "var(--color-surface-high)",
        line: "var(--color-line)",
        paper: "var(--color-paper)",
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-muted": "var(--color-primary-muted)",
        "primary-container": "var(--color-primary-container)",
        accent: "var(--color-accent)",
        "accent-muted": "var(--color-accent-muted)",
        sage: "var(--color-sage)",
      },
      maxWidth: {
        measure: "var(--max-measure)",
        readable: "var(--max-readable)",
        shell: "var(--max-shell)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        surface: "var(--radius-surface)",
        control: "var(--radius-control)",
      },
      spacing: {
        "ds-1": "var(--space-1)",
        "ds-2": "var(--space-2)",
        "ds-3": "var(--space-3)",
        "ds-4": "var(--space-4)",
        "ds-5": "var(--space-5)",
        "ds-6": "var(--space-6)",
        "ds-8": "var(--space-8)",
        "ds-10": "var(--space-10)",
        "ds-12": "var(--space-12)",
        "ds-16": "var(--space-16)",
        section: "var(--space-section-y)",
        "section-lg": "var(--space-section-y-lg)",
        hero: "var(--space-hero-pad-y)",
      },
      lineHeight: {
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        body: "var(--leading-body)",
      },
      letterSpacing: {
        tight: "var(--tracking-tight)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        nav: "var(--shadow-nav)",
        lift: "var(--shadow-lift)",
        preview: "var(--shadow-preview)",
        cta: "var(--shadow-cta)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        brand: ["var(--font-brand)", "var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "chat-dot": {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-2px)" },
        },
        /** Premium lesson: step / block enter (150–200ms) */
        "lesson-step-in": {
          "0%": { opacity: "0", transform: "translate3d(0,4px,0)" },
          "100%": { opacity: "1", transform: "translate3d(0,0,0)" },
        },
        "lesson-skeleton": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "chat-dot": "chat-dot 1.2s ease-in-out infinite",
        "lesson-step-in": "lesson-step-in 0.2s ease-out both",
        "lesson-skeleton": "lesson-skeleton 1.2s ease-in-out infinite",
      },
      transitionDuration: {
        180: "180ms",
        220: "220ms",
      },
    },
  },
  plugins: [],
};

export default config;
