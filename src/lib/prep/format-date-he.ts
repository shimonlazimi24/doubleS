/** תאריך בעברית (dateStyle long) - משותף לדפי הרכישה והמנוי. */
export function formatDateHe(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
