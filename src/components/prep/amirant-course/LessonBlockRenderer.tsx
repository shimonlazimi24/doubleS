import type { ContentBlock } from "@/lib/amirant-course/types/content-blocks";
import { LessonBlockCard } from "@/components/prep/amirant-course/lesson/LessonBlockCard";
import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import { expandSectionFlowToLessonCards } from "@/lib/amirant-course/lesson-content/microsection-split";

function calloutTitle(b: ContentBlock & { type: "callout" }): { title: string; variant: PremiumSectionVariant } {
  if (b.variant === "warning") return { title: "לתשומת לב", variant: "warning" };
  if (b.variant === "tip") return { title: "טיפ חשוב", variant: "tip" };
  return { title: "הבהרה", variant: "insight" };
}

/**
 * Renders registry `ContentBlock[]` as the same card stack as the premium lesson view (splitting long bodies into multiple cards when needed).
 */
export function LessonBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  const cards = blocks.flatMap((b, i) => {
    const id = `registry-${b.type}-${i}`;
    if (b.type === "intro") {
      return expandSectionFlowToLessonCards({ id, title: b.title, variant: "explanation", body: b.body });
    }
    if (b.type === "explanation") {
      return expandSectionFlowToLessonCards({ id, title: b.title, variant: "explanation", body: b.body });
    }
    if (b.type === "examples") {
      return expandSectionFlowToLessonCards({ id, title: b.title, variant: "example", items: b.items });
    }
    if (b.type === "summary") {
      return expandSectionFlowToLessonCards({ id, title: b.title, variant: "key-takeaway", bullets: b.bullets });
    }
    if (b.type === "callout") {
      const m = calloutTitle(b);
      return expandSectionFlowToLessonCards({ id, title: m.title, variant: m.variant, body: b.body });
    }
    return [];
  });

  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4 [direction:rtl] [text-align:start] sm:space-y-5">
      {cards.map((c) => (
        <LessonBlockCard
          key={c.key}
          title={c.title}
          variant={c.variant}
          body={c.body}
          items={c.items}
          bullets={c.bullets}
        />
      ))}
    </div>
  );
}
