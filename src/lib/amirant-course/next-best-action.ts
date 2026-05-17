import type { AmirantCourseAnalytics } from "./analytics/types";
import { AMIRANT_PREPARATION_MANIFEST } from "./manifest";
import { getAmirantCourseFlatLessons } from "./navigation";
import { courseProgressPercent, isLessonComplete } from "./progress/compute";
import type { AmirantProgressStateV1 } from "./progress/types";
import { AMIRANT_SIMULATIONS } from "./simulations/definitions";
import type { AmirantBankTopicSlug } from "./types/bank-question";
import { AMIRANT_TOPIC_LABEL_HE } from "./topic-labels";
import { PREP_BASE } from "@/lib/prep/constants";
import {
  getPrepConversionPrimaryCtaIsUpgrade,
  getPrepHasFullAccess,
  getPrepPricingPath,
} from "@/lib/prep/prep-full-access";

const DEFAULT_COURSE = `${PREP_BASE}/amirant/course`;

export type NextBestActionKind =
  | "review_mistakes"
  | "weak_quiz"
  | "simulation"
  | "continue_lesson"
  | "practice_weak"
  | "course_home";

export type NextBestAction = {
  kind: NextBestActionKind;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export type NextBestActionEnriched = NextBestAction & {
  why: string;
  progressLine: string;
  momentum: { line: string; cta: string; href: string } | null;
  conversion: {
    showUpgrade: boolean;
    pricingHref: string;
    pricingCta: string;
    subtleLine: string;
    primaryCtaIsUpgrade: boolean;
  } | null;
  display: {
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string | null;
    secondaryHref: string | null;
  };
};

const BANK_TOPICS: AmirantBankTopicSlug[] = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
];

export function normBase(courseBase: string): string {
  return courseBase.replace(/\/$/, "") || DEFAULT_COURSE;
}

export function topicLine(slug: AmirantBankTopicSlug): string {
  return AMIRANT_TOPIC_LABEL_HE[slug] ?? slug;
}

function topicModuleSlug(topic: AmirantBankTopicSlug): string {
  if (topic === "vocabulary") return "vocabulary";
  if (topic === "sentence_completion") return "sentence-completion";
  if (topic === "rephrasing") return "sentence-rephrasing";
  return "reading-comprehension";
}

/** Lesson + practice deep links (same structure as student-insights). */
export function getAmirantTopicLinks(
  topic: AmirantBankTopicSlug,
  courseBase: string = DEFAULT_COURSE,
): { lessonHref: string | null; practiceHref: string | null } {
  const b = normBase(courseBase);
  const moduleSlug = topicModuleSlug(topic);
  const courseModule = AMIRANT_PREPARATION_MANIFEST.modules.find(
    (row) => row.slug === moduleSlug,
  );
  const lessonId = courseModule?.lessons[0]?.id;
  const practiceSetId = courseModule?.practiceSets[0]?.id;
  return {
    lessonHref: lessonId ? `${b}/lesson/${lessonId}` : null,
    practiceHref: practiceSetId ? `${b}/practice/${practiceSetId}` : null,
  };
}

export function getFirstIncompleteLesson(
  progress: AmirantProgressStateV1,
  courseBase: string = DEFAULT_COURSE,
): { id: string; title: string; href: string } | null {
  const b = normBase(courseBase);
  for (const row of getAmirantCourseFlatLessons()) {
    if (!isLessonComplete(progress, row.lesson.id)) {
      return {
        id: row.lesson.id,
        title: row.lesson.title,
        href: `${b}/lesson/${row.lesson.id}`,
      };
    }
  }
  return null;
}

export function getCourseProgressMeta(progress: AmirantProgressStateV1): {
  percent: number;
  completed: number;
  total: number;
} {
  const total = getAmirantCourseFlatLessons().length;
  const pct = courseProgressPercent(AMIRANT_PREPARATION_MANIFEST, progress);
  const completed = Math.round((pct / 100) * total);
  return { percent: pct, completed, total };
}

function accuracy(row: { totalAnswered: number; totalCorrect: number }): number {
  if (row.totalAnswered <= 0) return 0;
  return row.totalCorrect / row.totalAnswered;
}

function weakTopicsFromRollup(
  byTopic: AmirantCourseAnalytics["byTopic"],
): Array<{ topic: AmirantBankTopicSlug; totalAnswered: number; totalCorrect: number }> {
  return BANK_TOPICS.map((topic) => {
    const roll = byTopic[topic];
    return {
      topic,
      totalAnswered: roll?.total ?? 0,
      totalCorrect: roll?.correct ?? 0,
    };
  })
    .filter((r) => r.totalAnswered > 0)
    .sort((a, b) => accuracy(a) - accuracy(b) || a.totalAnswered - b.totalAnswered);
}

function hasMeaningfulWeakness(
  w: Array<{ totalAnswered: number; totalCorrect: number }>,
): boolean {
  return w.some((row) => row.totalAnswered >= 3 && accuracy(row) < 0.55);
}

export function buildWeakestTopicPractice(
  weakTopics: Array<{ topic: AmirantBankTopicSlug; totalAnswered: number; totalCorrect: number }>,
  courseBase: string = DEFAULT_COURSE,
): { topic: AmirantBankTopicSlug; label: string; practiceHref: string } | null {
  const top = weakTopics[0];
  if (!top || top.totalAnswered === 0) return null;
  const links = getAmirantTopicLinks(top.topic, courseBase);
  if (!links.practiceHref) return null;
  return { topic: top.topic, label: topicLine(top.topic), practiceHref: links.practiceHref };
}

export type NextBestActionContext = {
  courseBase: string;
  weakTopics: Array<{
    topic: AmirantBankTopicSlug;
    totalAnswered: number;
    totalCorrect: number;
  }>;
  lessonProgressPercent: number;
  quizAttemptCount: number;
  submittedSimulationCount: number;
  sessionQuizCount: number;
  lastQuiz: {
    attemptId: string | null;
    mistakeCount: number;
    submittedAt: string | null;
  } | null;
  firstIncompleteLesson: { id: string; title: string; href: string } | null;
  firstSimulation: { id: string; title: string; href: string } | null;
  weakestTopicPractice: {
    topic: AmirantBankTopicSlug;
    label: string;
    practiceHref: string;
  } | null;
};

/**
 * Product prioritization — dynamic inputs only; no user-specific hardcoded branches.
 */
export function computeNextBestAction(ctx: NextBestActionContext): NextBestAction {
  const base = normBase(ctx.courseBase);
  const reviewHref =
    ctx.lastQuiz?.attemptId != null
      ? `${base}/review/${ctx.lastQuiz.attemptId}`
      : `${base}/review`;

  if (ctx.lastQuiz && ctx.lastQuiz.mistakeCount > 0 && ctx.lastQuiz.attemptId) {
    return {
      kind: "review_mistakes",
      title: "לסקור טעויות בבוחן האחרון",
      description: `נמצאו ${ctx.lastQuiz.mistakeCount} טעויות. סקירה קצרה מצמצמת חזרה על אותה טעות במבחן הבא.`,
      href: reviewHref,
      ctaLabel: "מעבר לסקירה",
    };
  }

  const earlyJourney = ctx.quizAttemptCount <= 1 || ctx.sessionQuizCount <= 1;
  if (earlyJourney || hasMeaningfulWeakness(ctx.weakTopics)) {
    const top = ctx.weakTopics[0];
    const accPct = top && top.totalAnswered > 0 ? Math.round(accuracy(top) * 100) : null;
    const weakHint = top
      ? `${topicLine(top.topic)}${
          accPct != null ? ` — כ-${accPct}% דיוק בניסיונות` : " — מעט נתונים עדיין"
        }`
      : "לפי אופי השאלות האחרונות";
    return {
      kind: "weak_quiz",
      title: "בוחן ממוקד בנושאים חלשים",
      description: `16 שאלות שנבנות סביב חולשות אמיתיות. מיקוד: ${weakHint}.`,
      href: `${base}/weak-quiz`,
      ctaLabel: "התחל בוחן חולשות",
    };
  }

  if (
    ctx.lessonProgressPercent >= 25 &&
    ctx.lessonProgressPercent < 85 &&
    ctx.submittedSimulationCount < 1 &&
    ctx.firstSimulation
  ) {
    return {
      kind: "simulation",
      title: `סימולציה: ${ctx.firstSimulation.title}`,
      description:
        "בשלב הזה — סימולציה מלאה בודקת שליטה בלחץ זמן, קרוב לתנאי מבחן אמיתי.",
      href: ctx.firstSimulation.href,
      ctaLabel: "התחל סימולציה",
    };
  }

  if (ctx.firstIncompleteLesson) {
    return {
      kind: "continue_lesson",
      title: `להמשיך: ${ctx.firstIncompleteLesson.title}`,
      description: "שיעור שלם = בסיס איתן לפני עומס בוחנים. זהו הצעד המומלץ עכשיו.",
      href: ctx.firstIncompleteLesson.href,
      ctaLabel: "המשך לשיעור",
    };
  }

  if (ctx.weakestTopicPractice) {
    return {
      kind: "practice_weak",
      title: `תרגול ממוקד: ${ctx.weakestTopicPractice.label}`,
      description: "תרגול ממוספר לפי נתוני התאמה אישית — חיזוק הדיוק לפני בוחן נוסף.",
      href: ctx.weakestTopicPractice.practiceHref,
      ctaLabel: "לתרגול",
    };
  }

  return {
    kind: "course_home",
    title: "לעמוד הקורס",
    description: "בחרו בוחן, תרגול או שיעור — לפי הזמן הזמין עכשיו.",
    href: base,
    ctaLabel: "לעמוד הקורס",
  };
}

/* ——— Display enrichment (does not change `computeNextBestAction` selection) ——— */

function journeyProgressLine(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const step = Math.min(4, Math.max(1, 1 + Math.floor(p / 25)));
  return `${p}% · שלב ${step} מתוך 4`;
}

function buildWhyNba(kind: NextBestActionKind, ctx: NextBestActionContext): string {
  const top = ctx.weakTopics[0];
  const topLabel = top ? topicLine(top.topic) : "הנתונים שצברת";
  const acc =
    top && top.totalAnswered > 0
      ? Math.round((top.totalCorrect / top.totalAnswered) * 100)
      : null;
  const lastM = ctx.lastQuiz?.mistakeCount ?? 0;
  const p = Math.round(ctx.lessonProgressPercent);

  switch (kind) {
    case "review_mistakes":
      return `כי בבוחן האחרון יש ${lastM} טעויות; סקירה קצרה מפחיתה חזרה על אותו דפוס לפני שמוסיפים עומס.`;
    case "weak_quiz":
      if (ctx.quizAttemptCount <= 1) {
        return "כי בתחילת המסלול — בוחן ממוקד מזהה במהירות היכן לחזק, לפני שמתפזרים על הכל.";
      }
      if (top && acc != null) {
        return `כי ${topLabel} בראש חולשות (כ-${acc}% דיוק) — בוחן ממוקד מכווץ שיפור.`;
      }
      return "כי יש הפרשים בין נושאים; בוחן ממוקד מרענן דגימה סביב החולשות.";
    case "simulation":
      return `בהתקדמות של ~${p}% בקורס, סימולציה בודקת ביצוע תחת לחץ — קרוב יותר לתנאי מבחן אמיתי.`;
    case "continue_lesson":
      return "כי עדיין יש שיעור פתוח; השלמה בונה בסיס לפני שמצטברים בוחנים.";
    case "practice_weak": {
      const label = ctx.weakestTopicPractice?.label ?? topLabel;
      return `כי ${label} מוביל/ה בנתוני ניסיון — תרגול ממוקד מייצר עליה בדיוק.`;
    }
    case "course_home":
    default:
      return "כי כאן בוחרים בוחן, תרגול או שיעור לפי הזמן; חזרה לתוכנית שומרת מומנטום.";
  }
}

function buildMomentumNba(
  kind: NextBestActionKind,
  ctx: NextBestActionContext,
): { line: string; cta: string; href: string } | null {
  const b = normBase(ctx.courseBase);
  if (kind === "review_mistakes") {
    return {
      line: "אחרי הסקירה — בוחן ממוקד מעדכן דירוג נושאים",
      cta: "לבוחן חולשות (אחרי סקירה)",
      href: `${b}/weak-quiz`,
    };
  }
  if (kind === "weak_quiz" && ctx.firstIncompleteLesson) {
    return {
      line: "אחרי הבוחן — לחזק דרך השיעור",
      cta: `הבא: ${ctx.firstIncompleteLesson.title}`,
      href: ctx.firstIncompleteLesson.href,
    };
  }
  if (kind === "continue_lesson" && ctx.firstSimulation) {
    return {
      line: "אחרי השיעור — לבדוק ביצועים בסימולציה",
      cta: "המשך: סימולציה",
      href: ctx.firstSimulation.href,
    };
  }
  if (kind === "practice_weak") {
    return {
      line: "אחרי התרגול — עקבו אחרי אנליטיקה",
      cta: "אנליטיקה",
      href: `${b}/analytics`,
    };
  }
  if (kind === "simulation") {
    return {
      line: "אחרי הסימולציה — בוחן או לוח",
      cta: "ללוח תלמיד",
      href: `${b}/dashboard`,
    };
  }
  if (kind === "course_home") {
    return {
      line: "רצף: צעד אחד בכל פעם",
      cta: "ללוח תלמיד",
      href: `${b}/dashboard`,
    };
  }
  return {
    line: "אחרי המשימה — בדקו איך הנושאים נעים בלוח",
    cta: "ללוח תלמיד",
    href: `${b}/dashboard`,
  };
}

export function withNextBestActionEnrichment(
  action: NextBestAction,
  ctx: NextBestActionContext,
  options: { hasFullAccess: boolean; primaryCtaIsUpgrade?: boolean } = { hasFullAccess: false },
): NextBestActionEnriched {
  const why = buildWhyNba(action.kind, ctx);
  const progressLine = journeyProgressLine(ctx.lessonProgressPercent);
  const momentum = buildMomentumNba(action.kind, ctx);
  const hasAccess = options.hasFullAccess;
  const pricingPath = getPrepPricingPath();
  const showUpgrade = !hasAccess;
  const primaryIsUpgrade = showUpgrade && (options.primaryCtaIsUpgrade ?? getPrepConversionPrimaryCtaIsUpgrade());

  const display = primaryIsUpgrade
    ? {
        primaryLabel: "קבל תוכנית מלאה",
        primaryHref: pricingPath,
        secondaryLabel: action.ctaLabel,
        secondaryHref: action.href,
      }
    : {
        primaryLabel: action.ctaLabel,
        primaryHref: action.href,
        secondaryLabel: showUpgrade ? "קבל תוכנית מלאה" : null,
        secondaryHref: showUpgrade ? pricingPath : null,
      };

  return {
    ...action,
    why,
    progressLine,
    momentum,
    conversion: showUpgrade
      ? {
          showUpgrade: true,
          pricingHref: pricingPath,
          pricingCta: "קבל תוכנית מלאה",
          subtleLine: "התוכנית המלאה: מסלול מסודר ומעקב — בלי לוותר על מה שכבר בנית.",
          primaryCtaIsUpgrade: primaryIsUpgrade,
        }
      : null,
    display,
  };
}

/** Env-only: no I/O. */
export function withNextBestActionEnrichmentFromEnv(
  action: NextBestAction,
  ctx: NextBestActionContext,
): NextBestActionEnriched {
  return withNextBestActionEnrichment(action, ctx, {
    hasFullAccess: getPrepHasFullAccess(),
    primaryCtaIsUpgrade: getPrepConversionPrimaryCtaIsUpgrade(),
  });
}

export function defaultFirstSimulation(
  courseBase: string = DEFAULT_COURSE,
): { id: string; title: string; href: string } | null {
  const sim = AMIRANT_SIMULATIONS[0];
  if (!sim) return null;
  const b = normBase(courseBase);
  return { id: sim.id, title: sim.title, href: `${b}/simulation/${sim.id}` };
}

/**
 * After completing an adaptive quiz: prefer review if mistakes, else use analytics snapshot for the rest.
 */
export function buildNextBestActionAfterQuiz(input: {
  courseBase: string;
  nextAnalytics: AmirantCourseAnalytics;
  attemptId: string | null;
  questionCount: number;
  correctCount: number;
  lessonProgressPercent: number;
  submittedSimulationCount: number;
  totalQuizAttempts: number;
  /** When set, can rank "continue lesson" after review / weak-quiz / sim rules. */
  firstIncompleteLesson?: { id: string; title: string; href: string } | null;
}): NextBestActionEnriched {
  const wrong = Math.max(0, input.questionCount - input.correctCount);
  const weakTopics = weakTopicsFromRollup(input.nextAnalytics.byTopic);
  const allTopicsForWeak = BANK_TOPICS.map((topic) => {
    const r = input.nextAnalytics.byTopic[topic];
    return { topic, totalAnswered: r?.total ?? 0, totalCorrect: r?.correct ?? 0 };
  }).sort((a, b) => accuracy(a) - accuracy(b) || a.totalAnswered - b.totalAnswered);

  const sessionQuiz = input.nextAnalytics.sessions.filter((s) => s.kind === "quiz");
  const firstSim = defaultFirstSimulation(input.courseBase);

  const ctx: NextBestActionContext = {
    courseBase: input.courseBase,
    weakTopics: allTopicsForWeak,
    lessonProgressPercent: input.lessonProgressPercent,
    quizAttemptCount: input.totalQuizAttempts,
    submittedSimulationCount: input.submittedSimulationCount,
    sessionQuizCount: sessionQuiz.length,
    lastQuiz: {
      attemptId: input.attemptId,
      mistakeCount: wrong,
      submittedAt: new Date().toISOString(),
    },
    firstIncompleteLesson: input.firstIncompleteLesson ?? null,
    firstSimulation: firstSim,
    weakestTopicPractice: buildWeakestTopicPractice(weakTopics.length ? weakTopics : allTopicsForWeak, input.courseBase),
  };
  return withNextBestActionEnrichmentFromEnv(computeNextBestAction(ctx), ctx);
}

/**
 * For signed-out / local-only dashboard: analytics + local progress.
 */
export function buildNextBestActionForLocal(
  nextAnalytics: AmirantCourseAnalytics,
  progress: AmirantProgressStateV1,
  courseBase: string = DEFAULT_COURSE,
): NextBestActionEnriched {
  const b = normBase(courseBase);
  const weakFromRollup = weakTopicsFromRollup(nextAnalytics.byTopic);
  const allTopics = BANK_TOPICS.map((topic) => {
    const r = nextAnalytics.byTopic[topic];
    return { topic, totalAnswered: r?.total ?? 0, totalCorrect: r?.correct ?? 0 };
  }).sort((a, b) => accuracy(a) - accuracy(b) || a.totalAnswered - b.totalAnswered);

  const sessionQuiz = nextAnalytics.sessions.filter((s) => s.kind === "quiz");
  const sessionSim = nextAnalytics.sessions.filter((s) => s.kind === "simulation");
  const { percent } = getCourseProgressMeta(progress);
  const firstLesson = getFirstIncompleteLesson(progress, b);

  const ctx: NextBestActionContext = {
    courseBase: b,
    weakTopics: weakFromRollup.length ? weakFromRollup : allTopics,
    lessonProgressPercent: percent,
    quizAttemptCount: sessionQuiz.length,
    submittedSimulationCount: sessionSim.length,
    sessionQuizCount: sessionQuiz.length,
    lastQuiz: null,
    firstIncompleteLesson: firstLesson,
    firstSimulation: defaultFirstSimulation(b),
    weakestTopicPractice: buildWeakestTopicPractice(weakFromRollup.length ? weakFromRollup : allTopics, b),
  };
  return withNextBestActionEnrichmentFromEnv(computeNextBestAction(ctx), ctx);
}
