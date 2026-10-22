"use client";

/**
 * Screen-reader announcements for a quiz timer, at two moments only.
 *
 * The visible clock changes every second; making it a live region would read
 * a new number every second over the question. Instead this hidden region
 * changes its text twice - five minutes and one minute before the end - and
 * the clock itself stays role="timer" (aria-live off) for on-demand reading.
 */
export function QuizTimeAnnouncer({ secondsLeft }: { secondsLeft: number }) {
  const message =
    secondsLeft <= 0
      ? "הזמן נגמר"
      : secondsLeft <= 60
        ? "נותרה דקה אחת"
        : secondsLeft <= 5 * 60
          ? "נותרו חמש דקות"
          : "";
  return (
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </span>
  );
}
