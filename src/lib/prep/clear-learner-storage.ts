/**
 * What a signed-in learner leaves in this browser: lesson progress, vocabulary
 * reviews, placement history, onboarding answers, a simulation in progress.
 * Signing out must remove it, or the public course page keeps showing the
 * previous account's progress and looks as if the learner is still signed in
 * (and on a shared computer the next person sees it).
 */
const LEARNER_KEY_PREFIXES = ["amirant", "prep_onboarding", "prep_adaptive_sim"];

export function clearLearnerKeys(store: Pick<Storage, "length" | "key" | "removeItem"> | undefined): void {
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key && LEARNER_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
}

export function clearLearnerStorage(): void {
  if (typeof window === "undefined") return;
  try {
    clearLearnerKeys(window.localStorage);
    clearLearnerKeys(window.sessionStorage);
  } catch {
    // Storage can be blocked (private mode, site data off); sign-out still proceeds.
  }
}
