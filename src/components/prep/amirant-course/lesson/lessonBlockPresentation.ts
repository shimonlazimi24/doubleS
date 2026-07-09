import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";

const shell = "rounded-2xl border p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8";

/**
 * Card shell + label colors - last utility wins; borders are set per variant.
 */
export function getLessonBlockPresentation(
  v: PremiumSectionVariant,
): { label: string; box: string; labelColor: string; iconWrap: string; titleClass: string } {
  switch (v) {
    case "tip":
      return {
        label: "טיפ",
        box: `border-blue-100 bg-blue-50/90 ${shell}`,
        labelColor: "text-blue-800/90",
        iconWrap: "rounded-xl bg-blue-100/80 p-2.5 text-blue-800",
        titleClass: "font-medium",
      };
    case "warning":
      return {
        label: "שים לב",
        box: `border-orange-100 bg-orange-50/90 ${shell}`,
        labelColor: "text-orange-900/90",
        iconWrap: "rounded-xl bg-orange-100/80 p-2.5 text-orange-900",
        titleClass: "font-medium",
      };
    case "common-mistake":
      return {
        label: "טעות נפוצה",
        box: `border-rose-100 bg-rose-50/90 ${shell}`,
        labelColor: "text-rose-900/90",
        iconWrap: "rounded-xl bg-rose-100/80 p-2.5 text-rose-900",
        titleClass: "font-medium",
      };
    case "example":
      return {
        label: "דוגמה",
        box: `border-gray-200 bg-gray-50/95 ${shell}`,
        labelColor: "text-gray-600",
        iconWrap: "rounded-xl border border-gray-200/80 bg-white p-2.5 text-gray-600",
        titleClass: "font-medium",
      };
    case "key-takeaway":
      return {
        label: "מה חשוב לזכור",
        box: `border-gray-200 bg-white ${shell} ring-1 ring-gray-100/80`,
        labelColor: "text-gray-700",
        iconWrap: "rounded-xl border border-gray-200/60 bg-white p-2.5 text-gray-600",
        titleClass: "font-semibold text-gray-900",
      };
    case "insight":
      return {
        label: "תובנה",
        box: `border-gray-200 bg-stone-50/60 ${shell}`,
        labelColor: "text-gray-600",
        iconWrap: "rounded-xl border border-gray-200/60 bg-white p-2.5 text-gray-600",
        titleClass: "font-medium",
      };
    default:
      return {
        label: "הסבר",
        box: `border-gray-200 bg-white ${shell}`,
        labelColor: "text-gray-500",
        iconWrap: "rounded-xl border border-gray-200/80 bg-stone-50/50 p-2.5 text-gray-500",
        titleClass: "font-medium",
      };
  }
}
