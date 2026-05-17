import type { ContentBlock } from "@/lib/amirant-course/types/content-blocks";
import type { PremiumSectionVariant } from "./split-markdown-lesson";

export type PremiumFlowItem =
  | { kind: "section"; id: string; title: string; variant: PremiumSectionVariant; body?: string; items?: string[]; bullets?: string[] }
  | { kind: "gate" };

function calloutMeta(v: "tip" | "warning" | "info"): { title: string; variant: PremiumSectionVariant } {
  if (v === "warning") return { title: "לתשומת לב", variant: "warning" };
  if (v === "tip") return { title: "טיפ חשוב", variant: "tip" };
  return { title: "הבהרה", variant: "insight" };
}

/**
 * הופך בלוקי registry לרשימה לרינדור פרימיום + שערי מחשבה אחרי כל 2 קטעים.
 */
export function contentBlocksToPremiumFlow(blocks: ContentBlock[]): PremiumFlowItem[] {
  const sections: Extract<PremiumFlowItem, { kind: "section" }>[] = [];

  blocks.forEach((b, i) => {
    const id = `b-${i}`;
    if (b.type === "intro") {
      sections.push({ kind: "section", id, title: b.title, variant: "explanation", body: b.body });
      return;
    }
    if (b.type === "explanation") {
      sections.push({ kind: "section", id, title: b.title, variant: "explanation", body: b.body });
      return;
    }
    if (b.type === "examples") {
      sections.push({ kind: "section", id, title: b.title, variant: "example", items: b.items });
      return;
    }
    if (b.type === "summary") {
      sections.push({ kind: "section", id, title: b.title, variant: "key-takeaway", bullets: b.bullets });
      return;
    }
    if (b.type === "callout") {
      const m = calloutMeta(b.variant);
      sections.push({ kind: "section", id, title: m.title, variant: m.variant, body: b.body });
    }
  });

  const withGates: PremiumFlowItem[] = [];
  sections.forEach((s, i) => {
    withGates.push(s);
    if (i % 2 === 1 && i < sections.length - 1) {
      withGates.push({ kind: "gate" });
    }
  });
  return withGates;
}
