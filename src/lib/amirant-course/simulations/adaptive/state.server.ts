/**
 * The attempt state travels with the learner as a signed token, so the route
 * is stateless and the browser can neither read the keys nor rewrite its
 * level. Signed with HMAC-SHA256; a tampered token is refused.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Level, PoolItemType, SectionPlan, SectionResult } from "./types";

export type ScoredEvent = { level: number; correct: boolean };

export type AttemptState = {
  v: 1;
  attemptId: string | null;
  userKey: string;
  seed: number;
  simId: string;
  startedAt: string;
  level: Level;
  /** Whether the last step went up (drives the nearest-level search direction). */
  lastUp: boolean;
  plan: SectionPlan[];
  sectionIndex: number;
  sectionStartedAt: string;
  /** Pool item ids used in this attempt, plus the ones carried over from past attempts. */
  used: string[];
  /** Related ids of everything used, never served in this attempt. */
  usedRelated: string[];
  /** The current section's served items: questionIds and their item ids. */
  current: {
    /** The level the section opened at. */
    enterLevel: number;
    itemIds: string[];
    questionIds: string[];
    levels: number[];
    answered: number;
    correct: number;
    /** Reading / listening sets: the set's level steps as they resolve. */
    writingTaskId?: string;
  };
  scoredEvents: ScoredEvent[];
  experimental: { correct: number; total: number };
  results: SectionResult[];
  writing: { taskId: string; text: string } | null;
  substitutions: number;
  finished: boolean;
};

function secret(): string {
  return (
    process.env.ADAPTIVE_SIM_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.HYP_PASSP ||
    "dev-only-adaptive-simulation-secret"
  );
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function encodeState(state: AttemptState): string {
  const payload = b64(JSON.stringify(state));
  return `${payload}.${sign(payload)}`;
}

export function decodeState(token: string): AttemptState | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(unb64(payload)) as AttemptState;
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function sectionTypeOf(state: AttemptState): PoolItemType | null {
  return state.plan[state.sectionIndex]?.type ?? null;
}
