import type { AmirantQuestionContextDetail } from "@/lib/prep/amirant-lesson-coach-events";
import { heApiError } from "@/lib/prep/he-api-error";

/**
 * Pure helpers behind the course assistant panel: payload shaping, SSE parsing,
 * hint-stage bookkeeping. Kept out of the component so the rules are unit-tested.
 */

export type AssistantRole = "user" | "assistant";
export type AssistantMessage = { id: string; role: AssistantRole; text: string };

/** Mirrors `lessonChatRequestSchema.userMessage` (max 1500). */
export const ASSISTANT_MESSAGE_MAX = 1500;
/** The counter appears only once the learner is near the limit. */
export const ASSISTANT_COUNTER_FROM = 1200;

export type AssistantClientAction = "auto" | "hint" | "next_hint" | "reveal" | "vocab_lookup" | "performance" | "recommend";

export type AssistantRequestPayload = {
  userMessage: string;
  /** What the thread shows for this turn when it differs from the text the server gets (button actions). */
  displayText?: string;
  lessonId?: string;
  clientAction?: AssistantClientAction;
  stagedHintContext?: { stage?: number; questionType?: string };
  vocabularyWord?: string;
  topic?: string;
};

export type HintSession = { stage: number; questionType?: string };

/** Up to the last 8 turns, each cut to 600 chars - the server schema's limits. */
export function buildHistoryPayload(messages: AssistantMessage[]): { role: AssistantRole; text: string }[] {
  return messages
    .filter((m) => m.text.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 600) }));
}

/**
 * The on-screen block the server grounds on. Mirrors `lessonChatActiveContextSchema`
 * limits; the answer key is never part of it (the server resolves it by `questionId`).
 */
export function buildActiveContextPayload(cq: AmirantQuestionContextDetail): Record<string, unknown> {
  return {
    kind: cq.kind ?? (cq.options?.length ? "quiz_question" : "lesson_step"),
    text: cq.questionText.slice(0, 2500),
    stepLabel: cq.stepLabel?.slice(0, 120),
    questionId: cq.questionId?.slice(0, 80),
    questionType: cq.questionType?.slice(0, 40),
    options: cq.options?.slice(0, 6).map((o) => ({ id: o.id.slice(0, 8), label: o.label.slice(0, 400) })),
    passageText: cq.passageText?.slice(0, 4000),
    timed: cq.timed,
    answered: cq.answered,
    selectedOptionId: cq.selectedOptionId ?? undefined,
  };
}

export type AssistantSseEvent =
  | { t: "ack" }
  | { t: "tok"; v: string }
  | { t: "done"; d: Record<string, unknown> }
  | { t: "err"; e?: string };

/** One SSE line -> event, or null for anything that is not a well-formed data line. */
export function parseSseLine(line: string): AssistantSseEvent | null {
  if (!line.startsWith("data: ")) return null;
  try {
    const ev = JSON.parse(line.slice(6)) as { t?: unknown; v?: unknown; d?: unknown; e?: unknown };
    if (ev.t === "ack") return { t: "ack" };
    if (ev.t === "tok" && typeof ev.v === "string") return { t: "tok", v: ev.v };
    if (ev.t === "done" && ev.d && typeof ev.d === "object") return { t: "done", d: ev.d as Record<string, unknown> };
    if (ev.t === "err") return { t: "err", e: typeof ev.e === "string" ? ev.e : undefined };
    return null;
  } catch {
    return null;
  }
}

/** The learner-facing text for a `done` event: answer plus the server's flags. */
export function finalAnswerText(d: Record<string, unknown>): string {
  const answer = typeof d.answer === "string" ? d.answer : "";
  const suffix = d.safeFallback ? "\n\n(מצב זהיר - מידע מוגבל/חסר.)" : "";
  const rec =
    typeof d.recommendedAction === "string" && d.recommendedAction.trim() ? `\n\n**המלצה:** ${d.recommendedAction}` : "";
  return answer + suffix + rec;
}

/**
 * Next hint session after a `done` event. The server says which stage it answered and
 * whether another one exists; after stage 3 (or a reveal) the only step left is the
 * solution, so the session ends - a stale "רמז נוסף" at stage 3 kept resending stage 3.
 */
export function nextHintSession(d: Record<string, unknown>): HintSession | null {
  const stage = Number(d.hintStage) || 0;
  if (d.nextHintAvailable && stage >= 1 && stage < 3) {
    return { stage: stage + 1, questionType: typeof d.questionType === "string" ? d.questionType : undefined };
  }
  return null;
}

/** The stem shown in the "על המסך" line: first line, cut on a word, no markdown noise. */
export function truncateStem(text: string, max = 90): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  const cut = oneLine.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Identity of the question on screen - a new one ends the hint session. */
export function questionKey(cq: AmirantQuestionContextDetail | null): string | null {
  if (!cq) return null;
  return cq.questionId ?? `${cq.kind ?? "x"}:${cq.questionText.slice(0, 200)}`;
}

/** Pages where the assistant has something to talk about. */
export function isContextualCoursePath(pathname: string): boolean {
  return /\/prep\/amirant\/course\/(lesson|quiz|simulation|review|weak-quiz|practice)/.test(pathname);
}

export function lessonIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/prep\/amirant\/course\/lesson\/([^/?#]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

/**
 * Hebrew copy for a failed (non-stream) response. The route's own Hebrew messages
 * (403 subscriber / sign-in copy) pass through; transport-level failures get the
 * generic copy from `heApiError`.
 */
export function httpErrorToHebrew(status: number, body: unknown): string {
  const raw = body && typeof body === "object" && "error" in body ? (body as { error?: unknown }).error : undefined;
  if (status === 429) return heApiError("rate limit");
  if (typeof raw === "string" && raw.trim()) return heApiError(raw, "הבקשה נכשלה.");
  if (status >= 500) return "השירות לא זמין כרגע. נסו שוב בעוד רגע.";
  return "הבקשה נכשלה.";
}

/** Characters left to show once near the limit; null while there is plenty of room. */
export function remainingCounter(length: number): number | null {
  return length >= ASSISTANT_COUNTER_FROM ? Math.max(0, ASSISTANT_MESSAGE_MAX - length) : null;
}
