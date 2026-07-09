import type { ExpandedLessonCard } from "@/lib/amirant-course/lesson-content/microsection-split";
import {
  buildRoadmapStructureIntroShort,
  parseMilestonesMarkdown,
  parseSixWeekProgramMarkdown,
  parseTrackingTableMarkdown,
  type RoadmapStepPayload,
} from "@/lib/amirant-course/lesson-content/roadmap-premium-parse";
import {
  UNIT1_IRON_RULES,
  UNIT1_NEXT_STEP_BLOCK,
  UNIT1_PLAN_4W_LINE,
  UNIT1_PLAN_8W_LINE,
} from "@/lib/amirant-course/lesson-content/unit1-verbatim-snippets";
import type { BuiltWorkspaceStep, UnifiedFlowItem } from "./workspace-step";

/** Curated roadmap lesson (`lesson.intro.roadmap`) - masach 1.2 from the same Unit 1 markdown file. */
export const CURATED_ROADMAP_LESSON_ID = "lesson.intro.roadmap";

const CLOSING_STEP_ID = "ws-curated-roadmap-closing";

function makeCard(key: string, stepLabel: string, body: string): ExpandedLessonCard {
  return {
    key: `curated-roadmap--${key}`,
    title: stepLabel,
    stepLabel,
    variant: "explanation",
    body: body.trim() || undefined,
  };
}

/**
 * Six steps; 4W/8W blurbs are verbatim lines from the welcome document; iron rules & next-step from the same source file.
 */
export function buildCuratedUnit1RoadmapSteps(flow: UnifiedFlowItem[], pageIntro: string): BuiltWorkspaceStep[] {
  const nil = { partIndex: null as null, partTotal: null as null };
  const sections = flow.filter((x): x is Extract<UnifiedFlowItem, { kind: "section" }> => x.kind === "section");

  const plan6 = sections.find((s) => /🗺️|תוכנית לימוד מוצעת|6 שבועות/.test(s.title))?.body?.trim() ?? "";
  const milestones = sections.find((s) => /יעדי אבן דרך/.test(s.title))?.body?.trim() ?? "";
  const tracking = sections.find((s) => /מעקב אישי/.test(s.title))?.body?.trim() ?? "";

  const { weeks, programTotalLine } = parseSixWeekProgramMarkdown(plan6);
  const roadmap: RoadmapStepPayload = {
    introShort: buildRoadmapStructureIntroShort(sections, pageIntro),
    weeks,
    milestoneGroups: parseMilestonesMarkdown(milestones),
    tracking: parseTrackingTableMarkdown(tracking),
    programTotalLine,
  };

  const steps: BuiltWorkspaceStep[] = [];

  steps.push({
    id: "curated-roadmap-structure",
    kind: "explanation",
    label: "איך בנויה מפת הדרכים",
    flowIndex: null,
    ...nil,
    card: makeCard("structure", "איך בנויה מפת הדרכים", roadmap.introShort),
    roadmap,
  });

  steps.push({
    id: "curated-roadmap-plan6",
    kind: "explanation",
    label: "תוכנית 6 שבועות",
    flowIndex: null,
    ...nil,
    card: makeCard("plan6", "תוכנית 6 שבועות", plan6),
    roadmap,
  });

  steps.push({
    id: "curated-roadmap-plan4",
    kind: "explanation",
    label: "תוכנית 4 שבועות",
    flowIndex: null,
    ...nil,
    card: makeCard("plan4", "תוכנית 4 שבועות", UNIT1_PLAN_4W_LINE),
  });

  steps.push({
    id: "curated-roadmap-plan8",
    kind: "explanation",
    label: "תוכנית 8 שבועות",
    flowIndex: null,
    ...nil,
    card: makeCard("plan8", "תוכנית 8 שבועות", UNIT1_PLAN_8W_LINE),
  });

  steps.push({
    id: "curated-roadmap-rules",
    kind: "explanation",
    label: "כללי עבודה מומלצים",
    flowIndex: null,
    ...nil,
    card: makeCard("rules", "כללי עבודה מומלצים", UNIT1_IRON_RULES),
  });

  steps.push({
    id: CLOSING_STEP_ID,
    kind: "summary",
    label: "הצעד הבא",
    flowIndex: null,
    ...nil,
    card: makeCard("next", "הצעד הבא", UNIT1_NEXT_STEP_BLOCK),
  });

  return steps;
}

export function isCuratedRoadmapClosingStep(stepId: string): boolean {
  return stepId === CLOSING_STEP_ID;
}
