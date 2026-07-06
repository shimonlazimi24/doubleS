/**
 * זיכרון הטפסים האחרונים של מבחן הרמה (localStorage) — כדי שבמעבר חוזר על המבחן
 * לא יופיעו אותן שאלות/קטע. שומרים את 2 הטפסים האחרונים.
 */
export type PlacementRecentForm = {
  questionIds: string[];
  passageId: string | null;
  at: string;
};

const LS_PLACEMENT_RECENT = "amirant-placement-recent-forms-v1";
const MAX_FORMS = 2;

export function loadRecentPlacementForms(): PlacementRecentForm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_PLACEMENT_RECENT);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (f): f is PlacementRecentForm =>
        !!f && typeof f === "object" && Array.isArray((f as PlacementRecentForm).questionIds),
    );
  } catch {
    return [];
  }
}

export function rememberPlacementForm(form: { questionIds: string[]; passageId: string | null }): void {
  if (typeof window === "undefined") return;
  try {
    const next: PlacementRecentForm[] = [
      { ...form, at: new Date().toISOString() },
      ...loadRecentPlacementForms(),
    ].slice(0, MAX_FORMS);
    window.localStorage.setItem(LS_PLACEMENT_RECENT, JSON.stringify(next));
  } catch {
    // localStorage לא זמין — מדלגים
  }
}

export function recentPlacementExclusions(): {
  questionIds: Set<string>;
  passageIds: Set<string>;
} {
  const forms = loadRecentPlacementForms();
  return {
    questionIds: new Set(forms.flatMap((f) => f.questionIds)),
    passageIds: new Set(forms.map((f) => f.passageId).filter((p): p is string => !!p)),
  };
}
