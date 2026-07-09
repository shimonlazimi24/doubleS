import type { PremiumSectionVariant } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import type { ExpandedLessonCard } from "@/lib/amirant-course/lesson-content/microsection-split";
import {
  parseClosingPremium,
  parseExamPremium,
  parseOpenPremium,
  parseSuccessRules,
  parseWhatPremium,
  parseWhyPremium,
  type WelcomeStepPayload,
} from "@/lib/amirant-course/lesson-content/welcome-premium-extract";
import type { BuiltWorkspaceStep, UnifiedFlowItem } from "./workspace-step";

/** Curated welcome lesson (`lesson.intro.welcome`) - 7 steps, grouped from `unit_1_complete_welcome_and_intro.md` masach 1.1 only. */
export const CURATED_WELCOME_LESSON_ID = "lesson.intro.welcome";

const CLOSING_STEP_ID = "ws-curated-welcome-closing";
const EXAM_STEP_ID = "curated-welcome-exam_intro";

type Bucket =
  | "meva"
  | "welcome"
  | "why"
  | "what"
  | "course_guide"
  | "legacy_commitment"
  | "exam_intro"
  | "reform"
  | "success"
  | "wrap_up"
  | "closing";

function classifySectionHeading(title: string): Bucket {
  const t = title.trim();
  if (/unit\s*1.*welcome|welcome\s*&\s*course\s*introduction/i.test(t)) return "meva";
  if (/שלום.*מזל|מזל טוב על הצעד|ברוכים הבאים לקורס/i.test(t)) return "welcome";
  if (/ציוני המבחן|למה בעצם|למה.*צריך.*מבחן/i.test(t)) return "why";
  if (/מה תקבלו|מה מקבלים/i.test(t)) return "what";
  if (/איך הקורס בנוי|העוזר האישי/i.test(t)) return "course_guide";
  // עותקי CMS ישנים: סעיפי "המחויבות" הוסרו מהשיעור - נבלעים ולא מרונדרים
  if (/המחויבות שלי(?!.*לעצמ)|המחויבות שלכם|לעצמכם/i.test(t)) return "legacy_commitment";
  if (/מבוא קצר.*מבחן/i.test(t)) return "exam_intro";
  if (/הרפורמה החדשה|19\.4\.2026/i.test(t)) return "reform";
  if (/איך מצליחים בקורס|💪/i.test(t)) return "success";
  if (/מבחן ראשוני|מתנת פתיחה|הצעד הבא|🎁|מתנה/i.test(t)) return "wrap_up";
  return "closing";
}

function makeCard(
  key: string,
  stepLabel: string,
  body: string,
  variant: PremiumSectionVariant = "explanation",
): ExpandedLessonCard {
  return {
    key: `curated-welcome--${key}`,
    title: stepLabel,
    stepLabel,
    variant,
    body: body.trim() || undefined,
  };
}

function joinBodies(bodies: string[]): string {
  return bodies
    .map((b) => b.trim())
    .filter(Boolean)
    .join("\n\n");
}

const LABEL = {
  welcome: "ברוכים הבאים",
  why: "ציוני המבחן והמשמעות",
  what: "מה מקבלים בקורס?",
  courseGuide: "איך הקורס בנוי + עוזר AI",
  success: "איך מצליחים בקורס הזה?",
  exam: "מבוא קצר למבחן אמירנט",
  closing: "סיכום והמשך",
} as const;

/**
 * Seven guided steps; quick-check on exam step when a gate exists in `flow`.
 */
export function buildCuratedUnit1WelcomeSteps(flow: UnifiedFlowItem[], pageIntro: string): BuiltWorkspaceStep[] {
  const nil = { partIndex: null as null, partTotal: null as null };
  const sections = flow.filter((x): x is Extract<UnifiedFlowItem, { kind: "section" }> => x.kind === "section");
  const gateIndex = flow.findIndex((x) => x.kind === "gate");

  const buckets: Record<Bucket, string[]> = {
    meva: [],
    welcome: [],
    why: [],
    what: [],
    course_guide: [],
    legacy_commitment: [],
    exam_intro: [],
    reform: [],
    success: [],
    wrap_up: [],
    closing: [],
  };

  for (const s of sections) {
    const body = (s.body ?? "").trim();
    buckets[classifySectionHeading(s.title)].push(body);
  }

  const courseGuideBody = joinBodies(buckets.course_guide);
  const examBody = joinBodies([...buckets.exam_intro, ...buckets.reform]);
  const closingBody = joinBodies([...buckets.wrap_up, ...buckets.closing]);

  const welcomePayloadOpen: WelcomeStepPayload = {
    step: "open",
    data: parseOpenPremium(pageIntro, buckets.meva, buckets.welcome),
  };
  const welcomePayloadWhy: WelcomeStepPayload | null = joinBodies(buckets.why)
    ? { step: "why", data: parseWhyPremium(joinBodies(buckets.why)) }
    : null;
  const welcomePayloadWhat: WelcomeStepPayload | null = joinBodies(buckets.what)
    ? { step: "what", data: parseWhatPremium(joinBodies(buckets.what)) }
    : null;
  const welcomePayloadSuccess: WelcomeStepPayload | null = joinBodies(buckets.success)
    ? { step: "success", data: parseSuccessRules(joinBodies(buckets.success)) }
    : null;
  const welcomePayloadExam: WelcomeStepPayload | null = examBody
    ? { step: "exam", data: parseExamPremium(examBody) }
    : null;
  const welcomePayloadClosing: WelcomeStepPayload = { step: "closing", data: parseClosingPremium(closingBody) };

  const openCardBody = welcomePayloadOpen.data.intro + (welcomePayloadOpen.data.highlight ? "\n\n" + welcomePayloadOpen.data.highlight : "");

  const steps: BuiltWorkspaceStep[] = [];

  steps.push({
    id: "curated-welcome-open",
    kind: "explanation",
    label: LABEL.welcome,
    flowIndex: null,
    ...nil,
    card: makeCard("open", LABEL.welcome, openCardBody || pageIntro, "explanation"),
    welcome: welcomePayloadOpen,
  });

  if (welcomePayloadWhy) {
    steps.push({
      id: "curated-welcome-why",
      kind: "explanation",
      label: LABEL.why,
      flowIndex: null,
      ...nil,
      card: makeCard("why", LABEL.why, joinBodies(buckets.why), "explanation"),
      welcome: welcomePayloadWhy,
    });
  }

  if (welcomePayloadWhat) {
    steps.push({
      id: "curated-welcome-what",
      kind: "explanation",
      label: LABEL.what,
      flowIndex: null,
      ...nil,
      card: makeCard("what", LABEL.what, joinBodies(buckets.what), "explanation"),
      welcome: welcomePayloadWhat,
    });
  }

  if (courseGuideBody) {
    steps.push({
      id: "curated-welcome-course-guide",
      kind: "explanation",
      label: LABEL.courseGuide,
      flowIndex: null,
      ...nil,
      card: makeCard("course-guide", LABEL.courseGuide, courseGuideBody, "explanation"),
    });
  }

  if (welcomePayloadSuccess) {
    steps.push({
      id: "curated-welcome-success",
      kind: "explanation",
      label: LABEL.success,
      flowIndex: null,
      ...nil,
      card: makeCard("success", LABEL.success, joinBodies(buckets.success), "explanation"),
      welcome: welcomePayloadSuccess,
    });
  }

  if (welcomePayloadExam) {
    steps.push({
      id: EXAM_STEP_ID,
      kind: "explanation",
      label: LABEL.exam,
      flowIndex: gateIndex >= 0 ? gateIndex : null,
      ...nil,
      embedQuickCheck: gateIndex >= 0,
      card: makeCard("exam", LABEL.exam, examBody, "explanation"),
      welcome: welcomePayloadExam,
    });
  }

  steps.push({
    id: CLOSING_STEP_ID,
    kind: "summary",
    label: LABEL.closing,
    flowIndex: null,
    ...nil,
    ...(closingBody
      ? {
          card: makeCard("closing", LABEL.closing, closingBody, "explanation"),
        }
      : {}),
    welcome: welcomePayloadClosing,
  });

  return steps;
}

export function isCuratedWelcomeClosingStep(stepId: string): boolean {
  return stepId === CLOSING_STEP_ID;
}

export function isCuratedWelcomeExamIntroStep(stepId: string): boolean {
  return stepId === EXAM_STEP_ID;
}
