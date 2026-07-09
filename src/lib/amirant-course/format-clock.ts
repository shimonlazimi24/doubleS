/** תצוגת טיימר M:SS - משותף לכל ממשקי החידונים/סימולציות. */
export function formatClock(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
