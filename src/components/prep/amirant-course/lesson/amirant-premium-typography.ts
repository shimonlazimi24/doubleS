/**
 * Single scale for premium Amirant lesson body (welcome / roadmap) - match `lessonSaaS` + product spec.
 */
export const amirantPremiumTypo = {
  pageTitle: "text-3xl font-semibold text-[#0f2347] sm:text-4xl",
  stepTitle: "text-2xl font-semibold text-[#0f2347] sm:text-3xl",
  sectionTitle: "text-xl font-semibold text-[#0f2347]",
  body: "text-lg leading-8 text-slate-700",
  bodyParagraph: "text-lg leading-8 text-slate-700 [text-align:start] [text-wrap:pretty]",
  meta: "text-sm text-slate-500 [text-align:start]",
  labelSky: "text-xs font-semibold uppercase tracking-wide text-sky-800/90 [text-align:start]",
  readingSurface: "w-full max-w-[65ch] [direction:rtl] [text-align:start]",
} as const;

export const amirantPremiumCard =
  "rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5 [direction:rtl] [text-align:start]";

export const amirantPremiumCardMuted = "rounded-2xl border border-sky-100/90 bg-sky-50/30 p-4 sm:p-5 [direction:rtl] [text-align:start]";
