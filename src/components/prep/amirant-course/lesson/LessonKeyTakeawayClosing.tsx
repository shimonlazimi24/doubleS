import { cn } from "@/lib/design-system/cn";

type Props = { className?: string; /** Flat on the workspace reading surface (no inner card). */ surface?: "card" | "embed" };

/**
 * Structural end-cap — no new teaching content; points learners back to summary blocks in the body.
 */
const closingCopy =
  "הדגשים המרכזיים הופיעו בכרטיסי השיעור למעלה. לפני שעוברים לתרגול, כדאי לוודא שהנקודות הללו «יושבות» בבירור.";

export function LessonKeyTakeawayClosing({ className, surface = "card" }: Props) {
  const shell =
    surface === "embed"
      ? "border-0 bg-transparent p-0 shadow-none [direction:rtl] [text-align:start]"
      : "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8";
  return (
    <section id="lesson-key-takeaway-closing" className={cn(shell, className)} lang="he">
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">מה חשוב לזכור</h2>
      <p className="mt-3 max-w-none text-base leading-relaxed text-gray-600 [text-wrap:pretty] sm:mt-4 sm:text-lg">
        {closingCopy}
      </p>
    </section>
  );
}
