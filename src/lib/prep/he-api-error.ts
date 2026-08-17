/** Map API / transport errors to short Hebrew copy for learners. */
export function heApiError(raw: unknown, fallback = "משהו לא עבד. נסו שוב."): string {
  const s = typeof raw === "string" ? raw : "";
  const lower = s.toLowerCase();
  if (!s.trim()) return fallback;
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "יותר מדי בקשות כרגע. המתינו רגע ונסו שוב.";
  }
  if (lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("403")) {
    return "אין גישה לעוזר במצב הנוכחי. בדקו מנוי או התחברות.";
  }
  if (lower.includes("invalid body") || lower.includes("bad request")) {
    return "הבקשה לא תקינה. נסחו מחדש ונסו שוב.";
  }
  if (lower.includes("supabase") || lower.includes("not configured")) {
    return "השירות לא זמין כרגע. נסו שוב בעוד רגע.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "שגיאת רשת. בדקו חיבור ונסו שוב.";
  }
  // Already Hebrew / product copy
  if (/[\u0590-\u05FF]/.test(s)) return s.slice(0, 160);
  return fallback;
}
