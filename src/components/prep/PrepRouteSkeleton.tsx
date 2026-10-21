import { Container } from "@/components/ui";

/**
 * What a signed-in page shows while its server data is on the way.
 *
 * Every page under the login reads from the database before it can render,
 * and that read is a round trip to another continent. Without a loading
 * boundary the previous page stays frozen on screen for the whole wait and
 * the click looks ignored. Each route's `loading.tsx` renders this, so the
 * navigation answers at once and the content fills in when it arrives.
 */
export function PrepRouteSkeleton({ label = "טוען", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div dir="rtl" lang="he" className="w-full">
      <Container max="measureWide" className="py-6">
        <div className="animate-lesson-skeleton space-y-6" role="status" aria-label={label}>
          <div className="space-y-3">
            <div className="h-3.5 w-24 rounded bg-stone-200/80" />
            <div className="h-8 w-3/5 max-w-md rounded bg-stone-200/80" />
            <div className="h-3 w-2/5 max-w-xs rounded bg-stone-200/60" />
          </div>
          <div className="divide-y divide-stone-200/70 border-y border-stone-200/70">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-6 py-4">
                <div className="h-4 w-1/3 rounded bg-stone-200/70" />
                <div className="h-3 w-16 rounded bg-stone-200/50" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
