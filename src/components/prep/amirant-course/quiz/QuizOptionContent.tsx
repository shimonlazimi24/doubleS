import { cn } from "@/lib/design-system/cn";

/**
 * The inside of an answer button: its letter, then its text.
 *
 * Every explanation in the bank is written in letter notation — "✅ (B) finish",
 * "❌ (A) eat" — while the options themselves rendered as bare text. A learner
 * had to count positions to map an explanation onto the answers, in a
 * right-to-left page whose options are left-to-right. Both the content reviewer
 * and the bank audit landed on this independently.
 *
 * The whole option is isolated as LTR so the English text and the letter keep
 * their reading order inside the Hebrew page.
 */
export function QuizOptionContent({
  index,
  label,
  state = "idle",
}: {
  /** 0-based position; rendered as A, B, C, D. */
  index: number;
  label: string;
  state?: "idle" | "selected" | "correct" | "wrong";
}) {
  const letter = String.fromCharCode(65 + index);
  return (
    <span className="flex items-baseline gap-2.5" dir="ltr">
      <span
        aria-hidden
        className={cn(
          "inline-flex h-5 w-5 shrink-0 translate-y-[1px] items-center justify-center rounded text-[0.7rem] font-semibold",
          state === "correct" && "bg-emerald-600 text-white",
          state === "wrong" && "bg-red-600 text-white",
          state === "selected" && "bg-primary text-white",
          state === "idle" && "bg-surface-low text-muted",
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1 text-start">{label}</span>
    </span>
  );
}
