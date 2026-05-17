import { LS_ANALYTICS } from "../constants";
import type { AmirantCourseAnalytics } from "./types";
import { emptyAnalytics } from "./types";

export function loadAnalytics(): AmirantCourseAnalytics {
  if (typeof window === "undefined") return emptyAnalytics();
  try {
    const raw = window.localStorage.getItem(LS_ANALYTICS);
    if (!raw) return emptyAnalytics();
    const p = JSON.parse(raw) as AmirantCourseAnalytics;
    if (p?.version !== 1) return emptyAnalytics();
    return p;
  } catch {
    return emptyAnalytics();
  }
}

export function saveAnalytics(a: AmirantCourseAnalytics): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_ANALYTICS, JSON.stringify(a));
}
