import { describe, expect, it } from "vitest";
import { clearLearnerKeys } from "./clear-learner-storage";

function memoryStore(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    get length() {
      return map.size;
    },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("clearLearnerKeys", () => {
  it("removes course, onboarding and simulation keys and keeps unrelated ones", () => {
    const store = memoryStore({
      "amirant-course:progress:v1": "{}",
      "amirant-vocab-srs:v1": "{}",
      "amirant-ws-lesson.1": "{}",
      prep_onboarding_v1: "{}",
      prep_adaptive_sim_v1: "{}",
      prep_cookie_consent: "all",
      "prep-purchase-tracked-123": "1",
    });

    clearLearnerKeys(store);

    expect(Array.from(store.map.keys()).sort()).toEqual(["prep-purchase-tracked-123", "prep_cookie_consent"]);
  });
});
