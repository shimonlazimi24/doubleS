import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import {
  cleanLessonStepSectionTitle,
  expandSectionFlowToLessonCards,
  type ExpandedLessonCard,
} from "@/lib/amirant-course/lesson-content/microsection-split";
import { buildCuratedUnit1WelcomeSteps } from "./curated-unit1-welcome-steps";
import { buildCuratedUnit1RoadmapSteps } from "./curated-unit1-roadmap-steps";
import { mergeFlowContentStepsForGranularity } from "./merge-workspace-flow-steps";
import type { RoadmapStepPayload } from "@/lib/amirant-course/lesson-content/roadmap-premium-parse";
import type { WelcomeStepPayload } from "@/lib/amirant-course/lesson-content/welcome-premium-extract";

/** Single unit in the lesson body (from markdown or JSON blocks) - same shape as the premium view. */
export type UnifiedFlowItem =
  | { kind: "gate" }
  | {
      kind: "section";
      id: string;
      title: string;
      variant: PremiumSectionVariant;
      body?: string;
      items?: string[];
      bullets?: string[];
    }
  | {
      /** שאלות אינטראקטיביות מהבנק (שיעורי "מבחן תרגול" / סימולציה). */
      kind: "questions";
      id: string;
      title: string;
      questionIds: string[];
      timeLimitSec?: number;
    };

/**
 * Visual / UX step kinds (maps from content + flow).
 */
export type WorkspaceStepKind =
  | "intro"
  | "explanation"
  | "example"
  | "tip"
  | "warning"
  | "quick_check"
  | "inline_questions"
  | "summary"
  | "practice_cta"
  | "ai_help";

export type BuiltWorkspaceStep = {
  id: string;
  kind: WorkspaceStepKind;
  /** Sidebar label (RTL), sanitized - never placeholder-only titles like "---". */
  label: string;
  /** Index in `flow` for section/gate steps; null for synthetic steps. */
  flowIndex: number | null;
  /**
   * For a flow `section` that expands to N micro-cards, which slice (0…N-1). Null for gates / chrome steps.
   */
  partIndex: number | null;
  /** N for this flow section when `partIndex` is set; null otherwise. */
  partTotal: number | null;
  /**
   * Pre-expanded card for this step - **single source of truth** for section body (sidebar + main use the same object).
   */
  card?: ExpandedLessonCard;
  /** `lesson.intro.roadmap` curated: structured UI instead of raw markdown. */
  roadmap?: RoadmapStepPayload;
  /** `lesson.intro.welcome` curated: premium blocks. */
  welcome?: WelcomeStepPayload;
  /** When true, render the flow gate interaction (בדיקה קצרה) inline after this step’s card - `flowIndex` must point at the gate. */
  embedQuickCheck?: boolean;
  /** שלב שאלות אינטראקטיביות - payload מ־UnifiedFlowItem kind "questions". */
  questions?: { title: string; questionIds: string[]; timeLimitSec?: number };
};

const TRUNC = 40;

function truncate(s: string, n = TRUNC): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

/** Horizontal rules / empty headings often become "---" in CMS - treat as missing title. */
export function isPlaceholderStepTitle(s: string): boolean {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return true;
  if (t === "---" || t === "-" || t === "—") return true;
  if (/^[-–—_]{2,}$/.test(t)) return true;
  return false;
}

function firstPlainLineFromBody(body: string | undefined): string | null {
  if (!body?.trim()) return null;
  for (const line of body.split("\n")) {
    const x = line
      .trim()
      .replace(/^#{1,6}\s+/, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/^\*\s+/, "")
      .trim();
    if (x && !isPlaceholderStepTitle(x)) return x;
  }
  return null;
}

function fallbackLabelFromCard(card: ExpandedLessonCard, sectionTitle: string): string {
  const fromHeading = firstPlainLineFromBody(card.body);
  if (fromHeading && !isPlaceholderStepTitle(fromHeading)) {
    return truncate(cleanLessonStepSectionTitle(fromHeading), MAX_LABEL);
  }
  const firstItem = card.items?.[0] ?? card.bullets?.[0];
  if (firstItem?.trim()) return truncate(firstItem.trim(), MAX_LABEL);
  const cleaned = cleanLessonStepSectionTitle(sectionTitle);
  return cleaned ? truncate(cleaned, MAX_LABEL) : "חלק בשיעור";
}

const MAX_LABEL = 72;

function finalizeStepLabel(raw: string, card: ExpandedLessonCard | undefined, sectionTitle: string): string {
  const base = raw.replace(/\s+/g, " ").trim();
  if (!isPlaceholderStepTitle(base)) return truncate(base, MAX_LABEL) || "חלק בשיעור";
  if (card) return fallbackLabelFromCard(card, sectionTitle);
  const t = cleanLessonStepSectionTitle(sectionTitle);
  return t ? truncate(t, MAX_LABEL) : "חלק בשיעור";
}

function variantToKind(v: PremiumSectionVariant): WorkspaceStepKind {
  switch (v) {
    case "example":
      return "example";
    case "tip":
      return "tip";
    case "warning":
    case "common-mistake":
      return "warning";
    case "key-takeaway":
      return "summary";
    case "insight":
      return "explanation";
    default:
      return "explanation";
  }
}

export type BuildLessonStepsOpts = {
  mode: "markdown" | "blocks" | "vocab";
  /** When set with curated lesson ids, uses explicit step maps instead of generic expansion. */
  lessonId?: string;
  /** Page intro (preamble) - used by curated Unit 1 builder. */
  intro?: string;
};

/**
 * Unified linear steps for the lesson workspace: **one array** for sidebar labels and main-body rendering.
 * Each flow section is expanded **once**; every section step carries the same `ExpandedLessonCard` used for display.
 */
export function buildLessonSteps(flow: UnifiedFlowItem[], opts: BuildLessonStepsOpts): BuiltWorkspaceStep[] {
  if (opts.mode === "markdown" && opts.lessonId === "lesson.intro.welcome") {
    return buildCuratedUnit1WelcomeSteps(flow, opts.intro ?? "");
  }

  if (opts.mode === "markdown" && opts.lessonId === "lesson.intro.roadmap") {
    return buildCuratedUnit1RoadmapSteps(flow, opts.intro ?? "");
  }

  if (opts.mode === "vocab") {
    const nil = { partIndex: null as null, partTotal: null as null };
    return [
      { id: "ws-intro", kind: "intro", label: "מבוא", flowIndex: null, ...nil },
      { id: "ws-vocab", kind: "explanation", label: "אוצר מילים", flowIndex: null, ...nil },
      { id: "ws-summary", kind: "summary", label: "סיכום והמשך", flowIndex: null, ...nil },
      { id: "ws-ai", kind: "ai_help", label: "עזרה (AI)", flowIndex: null, ...nil },
      { id: "ws-cta", kind: "practice_cta", label: "השלבים הבאים", flowIndex: null, ...nil },
    ];
  }

  const nil = { partIndex: null as null, partTotal: null as null };
  const out: BuiltWorkspaceStep[] = [{ id: "ws-intro", kind: "intro", label: "מבוא", flowIndex: null, ...nil }];

  flow.forEach((item, i) => {
    if (item.kind === "gate") {
      out.push({ id: `ws-gate-${i}`, kind: "quick_check", label: "בדיקה קצרה", flowIndex: i, ...nil });
      return;
    }
    if (item.kind === "questions") {
      out.push({
        id: `ws-questions-${i}`,
        kind: "inline_questions",
        label: item.title || "תרגול אינטראקטיבי",
        flowIndex: i,
        ...nil,
        questions: { title: item.title, questionIds: item.questionIds, timeLimitSec: item.timeLimitSec },
      });
      return;
    }
    const k = variantToKind(item.variant);
    const cards = expandSectionFlowToLessonCards({
      id: item.id,
      title: item.title,
      variant: item.variant,
      body: item.body,
      items: item.items,
      bullets: item.bullets,
    });
    if (cards.length === 0) {
      return;
    }
    cards.forEach((card, j) => {
      const raw = card.stepLabel || truncate(item.title) || "חלק";
      const label = finalizeStepLabel(raw, card, item.title);
      out.push({
        id: `ws-${item.id}--${i}--p${j}`,
        kind: k,
        label,
        flowIndex: i,
        partIndex: j,
        partTotal: cards.length,
        card,
      });
    });
  });

  out.push(
    { id: "ws-summary", kind: "summary", label: "סיכום והמשך", flowIndex: null, partIndex: null, partTotal: null },
    { id: "ws-ai", kind: "ai_help", label: "עזרה (AI)", flowIndex: null, partIndex: null, partTotal: null },
    { id: "ws-cta", kind: "practice_cta", label: "השלבים הבאים", flowIndex: null, partIndex: null, partTotal: null },
  );

  return mergeFlowContentStepsForGranularity(out);
}

/** @deprecated Use `buildLessonSteps` - kept for existing imports. */
export const buildWorkspaceSteps = buildLessonSteps;

export function flowItemAtIndex(flow: UnifiedFlowItem[], flowIndex: number | null): UnifiedFlowItem | null {
  if (flowIndex == null || flowIndex < 0 || flowIndex >= flow.length) return null;
  return flow[flowIndex] ?? null;
}
