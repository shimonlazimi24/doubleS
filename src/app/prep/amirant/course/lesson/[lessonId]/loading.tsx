import { Container } from "@/components/ui";

/**
 * Shown during client navigation to another lesson (App Router `loading.js` boundary).
 * Keeps layout stable to reduce flash while RSC payload streams.
 */
export default function LessonLoading() {
  return (
    <div className="w-full [direction:rtl] [text-align:start]" dir="rtl" lang="he">
      <Container max="measureWide" className="py-6">
        <div
          className="animate-lesson-skeleton space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/90 p-6"
          role="status"
          aria-label="טוען שיעור"
        >
          <div className="h-4 w-2/5 max-w-xs rounded bg-stone-200/90" />
          <div className="h-8 w-4/5 max-w-md rounded bg-stone-200/80" />
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full rounded bg-stone-200/70" />
            <div className="h-3 w-[92%] rounded bg-stone-200/60" />
            <div className="h-3 w-[88%] rounded bg-stone-200/50" />
          </div>
        </div>
      </Container>
    </div>
  );
}
