import { getResolvedAmirantProductionContent } from "./resolved-content";

export type AmirantContentQualityMode =
  | "authored_production"
  | "demo_generated_present"
  | "demo_fallback";

export function getAmirantContentQualityMode(): AmirantContentQualityMode {
  const content = getResolvedAmirantProductionContent();
  if (!content) return "demo_fallback";

  const hasGenerated = content.questionBank.some(
    (q) =>
      /-gen-d\d-/i.test(q.id) ||
      /generated-bulk/i.test(q.subtopicSlug),
  );
  return hasGenerated ? "demo_generated_present" : "authored_production";
}
