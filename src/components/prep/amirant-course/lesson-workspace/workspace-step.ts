import type { WordFormationPublicItem } from "@/lib/amirant-course/word-formation/types";
import type { WritingGuidePublic, WritingTaskPublic } from "@/lib/amirant-course/writing/types";
import type { BankQuestionPublic } from "@/lib/amirant-course/question-bank/public-bank";
import type { ClientPassage } from "@/lib/amirant-course/question-bank/client-types";
import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import {
  cleanLessonStepSectionTitle,
  cleanStepHeading,
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
      /** Serialised by the server page for this lesson only — the browser holds no bank. */
      questions: BankQuestionPublic[];
      /** The reading passages those questions point at. */
      passages: ClientPassage[];
      timeLimitSec?: number;
      /** Word formation: typed answers instead of options (questions stays empty). */
      wordFormation?: WordFormationPublicItem[];
    }
  | {
      /** A writing task: editor, timer, server grading. */
      kind: "writing";
      id: string;
      task: WritingTaskPublic;
      guide: WritingGuidePublic;
      /** Whether the grader runs for this learner (paid access). */
      canSubmit: boolean;
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
  | "writing_task"
  | "summary"
  | "practice_cta";

export type BuiltWorkspaceStep = {
  id: string;
  kind: WorkspaceStepKind;
  /** Sidebar label (RTL), sanitized - never placeholder-only titles like "---". May be shortened. */
  label: string;
  /** The section's full heading for the step's H2 when the label had to be shortened. */
  heading?: string;
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
  questions?: {
    title: string;
    questions: BankQuestionPublic[];
    passages: ClientPassage[];
    timeLimitSec?: number;
    wordFormation?: WordFormationPublicItem[];
  };
  /** The writing task step - payload from UnifiedFlowItem kind "writing". */
  writing?: { task: WritingTaskPublic; guide: WritingGuidePublic; canSubmit: boolean };
};

const TRUNC = 40;

function truncate(s: string, n = TRUNC): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

/**
 * "1. פתיחה", "2) מבנה", "3.1 זמן": the source document's outline numbers;
 * the workspace already counts steps. Names such as "שיטה 1:" keep theirs.
 */
export function stripLeadingNumbering(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  const out = t.replace(/^(?:\d+(?:\.\d+)*[.)]|\d+(?:\.\d+)+)\s+[-–—]?\s*/, "").trim();
  return out || t;
}

function cleanTitle(s: string): string {
  return stripLeadingNumbering(cleanLessonStepSectionTitle(s));
}

function firstHeadingLine(body: string | undefined): string | null {
  const first = body?.split("\n").find((l) => l.trim())?.trim();
  const m = first?.match(/^#{1,6}\s+(.+)$/);
  return m?.[1] ? cleanTitle(cleanStepHeading(m[1])) : null;
}

/**
 * The step's full heading, when the body opens with one that the (possibly
 * shortened) label was derived from. Otherwise the label is the heading.
 */
export function fullHeadingForLabel(label: string, body: string | undefined): string | undefined {
  const heading = firstHeadingLine(body);
  if (!heading) return undefined;
  const stem = label.replace(/…$/, "").replace(/\s+/g, " ").trim();
  if (!stem) return undefined;
  const norm = (x: string) => x.toLowerCase();
  if (norm(heading) === norm(stem)) return heading === label ? undefined : heading;
  if (label.endsWith("…") && norm(heading).startsWith(norm(stem))) return heading;
  return undefined;
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
    return truncate(cleanTitle(fromHeading), MAX_LABEL);
  }
  const firstItem = card.items?.[0] ?? card.bullets?.[0];
  if (firstItem?.trim()) return truncate(firstItem.trim(), MAX_LABEL);
  const cleaned = cleanTitle(sectionTitle);
  return cleaned ? truncate(cleaned, MAX_LABEL) : "חלק בשיעור";
}

const MAX_LABEL = 72;

function finalizeStepLabel(raw: string, card: ExpandedLessonCard | undefined, sectionTitle: string): string {
  const base = stripLeadingNumbering(raw);
  if (!isPlaceholderStepTitle(base)) return truncate(base, MAX_LABEL) || "חלק בשיעור";
  if (card) return fallbackLabelFromCard(card, sectionTitle);
  const t = cleanTitle(sectionTitle);
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
      { id: "ws-cta", kind: "practice_cta", label: "סיום השיעור", flowIndex: null, ...nil },
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
        questions: {
          title: item.title,
          questions: item.questions,
          passages: item.passages,
          timeLimitSec: item.timeLimitSec,
          wordFormation: item.wordFormation,
        },
      });
      return;
    }
    if (item.kind === "writing") {
      out.push({
        id: `ws-writing-${i}`,
        kind: "writing_task",
        label: "המטלה",
        flowIndex: i,
        ...nil,
        writing: { task: item.task, guide: item.guide, canSubmit: item.canSubmit },
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
      const heading = fullHeadingForLabel(label, card.body);
      out.push({
        id: `ws-${item.id}--${i}--p${j}`,
        kind: k,
        label,
        ...(heading ? { heading } : {}),
        flowIndex: i,
        partIndex: j,
        partTotal: cards.length,
        card,
      });
    });
  });

  // No synthetic summary: a real summary section arrives as its own card step.
  out.push({ id: "ws-cta", kind: "practice_cta", label: "סיום השיעור", flowIndex: null, partIndex: null, partTotal: null });

  return mergeFlowContentStepsForGranularity(out);
}

/** @deprecated Use `buildLessonSteps` - kept for existing imports. */
export const buildWorkspaceSteps = buildLessonSteps;

export function flowItemAtIndex(flow: UnifiedFlowItem[], flowIndex: number | null): UnifiedFlowItem | null {
  if (flowIndex == null || flowIndex < 0 || flowIndex >= flow.length) return null;
  return flow[flowIndex] ?? null;
}
