/** "31 באוקטובר 2026" from an ISO date; empty for an unparsable one. */
export function formatHeDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
