import { markdownishToPlain } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import type { ExpandedLessonCard } from "@/lib/amirant-course/lesson-content/microsection-split";
import type { BuiltWorkspaceStep } from "./workspace-step";

/** ~200–400 chars target; sentence count as secondary. */
const MIN_STEP_CHARS = 320;
const MIN_STEP_SENTENCES = 4;

function plainLen(body: string | undefined): number {
  return markdownishToPlain(body ?? "", 200_000).length;
}

function approxSentenceCount(body: string | undefined): number {
  const p = markdownishToPlain(body ?? "", 200_000);
  if (!p.trim()) return 0;
  const byPunct = p.split(/[.!?]+/).filter((x) => x.replace(/\s/g, "").length > 8);
  return Math.max(byPunct.length, p.split(/\n+/).filter((l) => l.trim().length > 12).length);
}

function isEnoughContent(body: string | undefined): boolean {
  // טבלת markdown היא תוכן מלא גם אם המנקה מוריד את שורותיה מהספירה
  if (body && /^\s*\|.*\|\s*$/m.test(body)) return true;
  return plainLen(body) >= MIN_STEP_CHARS || approxSentenceCount(body) >= MIN_STEP_SENTENCES;
}

function isSyntheticChrome(s: BuiltWorkspaceStep): boolean {
  return s.id === "ws-summary" || s.id === "ws-ai" || s.id === "ws-cta";
}

/** כרטיס שנפתח בכותרת markdown הוא תחילת תת-נושא - לא ממזגים אותו אל צעד קודם. */
function startsWithHeading(s: BuiltWorkspaceStep): boolean {
  return /^#{2,6}\s/.test((s.card?.body ?? "").trimStart());
}

function isFlowContentStep(s: BuiltWorkspaceStep): boolean {
  if (!s.card || s.flowIndex == null) return false;
  if (s.kind === "quick_check") return false;
  if (isSyntheticChrome(s)) return false;
  if (s.id === "ws-intro") return false;
  return true;
}

function joinCards(cards: ExpandedLessonCard[]): ExpandedLessonCard {
  const first = cards[0]!;
  const body = cards
    .map((c) => c.body?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
  const items = cards.flatMap((c) => c.items ?? []);
  const bullets = cards.flatMap((c) => c.bullets ?? []);
  return {
    key: cards.map((c) => c.key).join("+"),
    title: first.title,
    stepLabel: first.stepLabel,
    variant: first.variant,
    body: body || undefined,
    ...(items.length ? { items } : {}),
    ...(bullets.length ? { bullets } : {}),
  };
}

function joinWorkspaceContentSteps(buf: BuiltWorkspaceStep[]): BuiltWorkspaceStep {
  const first = buf[0]!;
  const cards = buf.map((s) => s.card!);
  const merged = joinCards(cards);
  const label = first.label;
  return {
    id: buf.map((s) => s.id).join("+"),
    kind: first.kind,
    label,
    flowIndex: first.flowIndex,
    partIndex: null,
    partTotal: null,
    card: { ...merged, stepLabel: label, title: label },
  };
}

/**
 * Merges consecutive flow-backed content steps until each has enough reading depth.
 * Gates and chrome steps break the buffer (gates flush first).
 */
export function mergeFlowContentStepsForGranularity(steps: BuiltWorkspaceStep[]): BuiltWorkspaceStep[] {
  const out: BuiltWorkspaceStep[] = [];
  let buf: BuiltWorkspaceStep[] = [];

  const flushBuf = () => {
    if (buf.length === 0) return;
    if (buf.length === 1) {
      out.push(buf[0]!);
    } else {
      out.push(joinWorkspaceContentSteps(buf));
    }
    buf = [];
  };

  for (const s of steps) {
    if (s.id === "ws-intro") {
      flushBuf();
      out.push(s);
      continue;
    }
    if (isSyntheticChrome(s)) {
      flushBuf();
      out.push(s);
      continue;
    }
    if (s.kind === "quick_check") {
      flushBuf();
      out.push(s);
      continue;
    }
    if (isFlowContentStep(s)) {
      // לעולם לא ממזגים חוצה-סקשן: כותרת הצעד נלקחת מהכרטיס הראשון,
      // ומיזוג בין סקשנים גורם לתוכן "להיעלם" תחת כותרת של סקשן אחר.
      if (
        buf.length > 0 &&
        (buf[buf.length - 1]!.flowIndex !== s.flowIndex || startsWithHeading(s))
      ) {
        flushBuf();
      }
      buf.push(s);
      const merged = joinWorkspaceContentSteps(buf);
      if (isEnoughContent(merged.card?.body)) {
        out.push(merged);
        buf = [];
      }
      continue;
    }
    flushBuf();
    out.push(s);
  }
  flushBuf();

  for (let i = out.length - 1; i >= 1; i--) {
    const cur = out[i]!;
    const prev = out[i - 1]!;
    if (!isFlowContentStep(cur) || !isFlowContentStep(prev)) continue;
    if (prev.flowIndex !== cur.flowIndex || startsWithHeading(cur)) continue;
    if (isEnoughContent(cur.card?.body)) continue;
    const joined = joinWorkspaceContentSteps([prev, cur]);
    out.splice(i - 1, 2, joined);
  }

  return out;
}
