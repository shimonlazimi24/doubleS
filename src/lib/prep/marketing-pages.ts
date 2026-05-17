import type { PrepMarketingSlug } from "@/lib/prep/constants";

export const PREP_MARKETING_TITLES: Record<PrepMarketingSlug, string> = {
  toefl: "TOEFL",
  amirant: "אמירנט",
  pricing: "מחירים",
  blog: "בלוג",
  about: "אודות",
  contact: "יצירת קשר",
  privacy: "מדיניות פרטיות",
  login: "התחברות",
};

const INTROS: Partial<Record<PrepMarketingSlug, string>> = {
  login: "מעבר לעמוד ההתחברות…",
  amirant:
    "עמוד אמירנט הראשי מוביל ישירות לקורס ההכנה המלא.",
};

export function getPrepMarketingPageBody(slug: PrepMarketingSlug, productName: string): string {
  return (
    INTROS[slug] ??
    `${productName} — עמוד תוכן זמני אחרי העברת הפרויקט; יוחלף בתוכן אמיתי או ב־MDX.`
  );
}
