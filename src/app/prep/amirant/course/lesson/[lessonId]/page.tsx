import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  displayModuleTitleHe,
  getAmirantCourseLessonEntry,
  getManifestLesson,
} from "@/lib/amirant-course";
import { getLessonContentWithCmsOverride } from "@/lib/amirant-course/cms-override.server";
import type { ContentBlock } from "@/lib/amirant-course/types/content-blocks";
import { getAmirantCourseLessonNeighbors } from "@/lib/amirant-course/navigation";
import { splitMarkdownByMasachH1, stripMasachNumberingForDisplay } from "@/lib/amirant-course/content-source/split-markdown-masach";
import {
  interleaveMarkdownGates,
  markdownishToPlain,
  splitMarkdownIntoSections,
  type PremiumMarkdownSection,
} from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import { contentBlocksToPremiumFlow } from "@/lib/amirant-course/lesson-content/blocks-to-premium-flow";
import { getLessonQuestionGroup, SIMULATION_LESSON_RUNTIME } from "@/lib/amirant-course/lesson-content/lesson-question-groups";
import { stripQuestionSections } from "@/lib/amirant-course/lesson-content/strip-question-sections";
import { getBankQuestionsByTag } from "@/lib/amirant-course";
import { parseVocabularyMarkdown, vocabularyBodyHasNumberedWordEntries } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";
import { readAmirantCourseMarkdownSource } from "@/lib/prep/amirnet-materials.server";
import { PREP_BASE } from "@/lib/prep/constants";
import { requireAmirantLessonAccess } from "@/lib/prep/amirant-lesson-access.server";
import { AmirantCourseLessonScopeTracker } from "@/components/prep/amirant-course/AmirantCourseLessonScopeTracker";
import { IntroPersonalRoadmapClient } from "@/components/prep/amirant-course/lesson-workspace/IntroPersonalRoadmapClient";
import { AmirantPremiumLessonView, type UnifiedFlowItem } from "@/components/prep/amirant-course/premium/AmirantPremiumLessonView";
import { AmirantVideoEmbed } from "@/components/prep/amirant-course/lesson/AmirantVideoEmbed";
import { Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

const BASE = `${PREP_BASE}/amirant/course`;

/** Legacy Unit 1 IDs → canonical lessons (stable URLs). */
const LEGACY_LESSON_REDIRECT: Record<string, string> = {
  "lesson.intro.doc-1-1": "lesson.intro.welcome",
  "lesson.intro.doc-1-2": "lesson.intro.roadmap",
  "lesson.intro.doc-1-3": "lesson.intro.personal-roadmap",
};

function unifiedSectionsToFlow(sections: PremiumMarkdownSection[]): UnifiedFlowItem[] {
  return sections.map((s) => ({
    kind: "section" as const,
    id: s.id,
    title: s.heading,
    variant: s.variant,
    body: s.body,
  }));
}

function markdownBodyForLesson(fullBody: string, content: { amirnetMarkdownSectionIndex?: number }): string {
  if (content.amirnetMarkdownSectionIndex === undefined) return fullBody;
  const parts = splitMarkdownByMasachH1(fullBody);
  const i = content.amirnetMarkdownSectionIndex;
  if (i < 0 || i >= parts.length) return parts[0] ?? fullBody;
  return parts[i] ?? fullBody;
}

type Props = { params: { lessonId: string } };

export function generateMetadata({ params }: Props): Metadata {
  const hit = getManifestLesson(params.lessonId);
  if (!hit) return { title: "שיעור" };
  return { title: `${hit.lesson.title} | הכנה לאמירנט` };
}

function buildBlockIntro(blocks: ContentBlock[]): string {
  const intro = blocks.find((b) => b.type === "intro");
  if (intro) return markdownishToPlain(intro.body, 360);
  const ex = blocks.find((b) => b.type === "explanation");
  if (ex) return markdownishToPlain(ex.body, 280);
  return "השיעור בקטעים - עברו במצב צעדים או עם «הצג הכל».";
}

export default async function AmirantCourseLessonPage({ params }: Props) {
  const legacyTarget = LEGACY_LESSON_REDIRECT[params.lessonId];
  if (legacyTarget) {
    redirect(`${BASE}/lesson/${legacyTarget}`);
  }

  const hit = getManifestLesson(params.lessonId);
  if (!hit) notFound();
  await requireAmirantLessonAccess(params.lessonId);
  const courseEntry = getAmirantCourseLessonEntry(params.lessonId);
  if (!courseEntry) notFound();
  const indexInModule = courseEntry.module.lessons.findIndex((l) => l.id === hit.lesson.id);
  if (indexInModule < 0) notFound();

  if (hit.lesson.id === "lesson.intro.diagnostic") {
    redirect(`${BASE}/quiz/quiz-entry-diagnostic`);
  }

  if (hit.lesson.id === "lesson.intro.personal-roadmap") {
    const { next: nextLesson } = getAmirantCourseLessonNeighbors(params.lessonId);
    return (
      <div className="min-h-screen w-full max-w-none bg-slate-50/50 pb-16 [direction:rtl]">
        <AmirantCourseLessonScopeTracker lessonId={hit.lesson.id} />
        <nav className="text-xs font-medium text-muted [direction:rtl]">
          <Link href={BASE} className="transition hover:text-primary">
            הכנה לאמירנט
          </Link>
          <span className="mx-2 text-line">/</span>
          <Link href={`${BASE}/module/${hit.module.slug}`} className="text-ink transition hover:text-primary">
            {displayModuleTitleHe(hit.module)}
          </Link>
        </nav>
        <div className="mt-8">
          <IntroPersonalRoadmapClient
            courseBase={BASE}
            module={hit.module}
            lessonId={hit.lesson.id}
            lessonTitle={hit.lesson.title}
            nextLessonHref={nextLesson ? `${BASE}/lesson/${nextLesson.lesson.id}` : BASE}
            nextLessonTitle={nextLesson?.lesson.title ?? "תוכנית הקורס"}
            nextScopeEyebrow={
              nextLesson && nextLesson.module.id !== hit.module.id
                ? `היחידה הבאה: ${displayModuleTitleHe(nextLesson.module)}`
                : "המשך ביחידה"
            }
          />
        </div>
      </div>
    );
  }

  const { content, source: contentSource, videoUrl: cmsVideoUrl } = await getLessonContentWithCmsOverride(params.lessonId);
  if (!content) notFound();
  const isCmsOverride = contentSource === "cms";
  // CMS override: body_markdown is injected as cmsMarkdown
  const cmsMarkdown = isCmsOverride ? (content as typeof content & { cmsMarkdown?: string }).cmsMarkdown ?? null : null;
  const hasMd = isCmsOverride ? Boolean(cmsMarkdown) : Boolean(content.amirnetMarkdownRel);
  const hasBlocks = content.blocks.length > 0;
  if (!hasMd && !hasBlocks) notFound();

  const md = isCmsOverride && cmsMarkdown
    ? { ok: true as const, body: cmsMarkdown }
    : (hasMd && content.amirnetMarkdownRel ? readAmirantCourseMarkdownSource(content.amirnetMarkdownRel) : null);
  // שיעורי "מבחן תרגול": השאלות השטוחות נחתכות מה-md ומרונדרות כרכיב אינטראקטיבי מהבנק.
  // חותכים רק אם קבוצת השאלות באמת נמצאה בבנק - אחרת (תג הוסב / מאגר נכשל)
  // עדיף להשאיר את השאלות כטקסט מאשר שיעור בלי שאלות בכלל.
  const questionGroup = getLessonQuestionGroup(params.lessonId);
  const groupQuestions = questionGroup ? getBankQuestionsByTag(questionGroup.tag) : [];
  const hasInteractiveQuestions = groupQuestions.length > 0;
  const simulationRuntimeId = SIMULATION_LESSON_RUNTIME[params.lessonId] ?? null;
  const rawLessonBody = md?.ok
    ? stripMasachNumberingForDisplay(markdownBodyForLesson(md.body, content))
    : null;
  const lessonBody =
    rawLessonBody != null && (hasInteractiveQuestions || simulationRuntimeId)
      ? stripQuestionSections(rawLessonBody)
      : rawLessonBody;
  const vocabParsed = lessonBody != null ? parseVocabularyMarkdown(lessonBody) : null;
  const useVocabUi = hit.module.id === "mod-vocab" && vocabParsed != null && vocabularyBodyHasNumberedWordEntries(vocabParsed);

  const { prev, next } = getAmirantCourseLessonNeighbors(params.lessonId);
  const sidebarNextLesson =
    next != null
      ? {
          href: `${BASE}/lesson/${next.lesson.id}`,
          lessonTitle: next.lesson.title,
          scopeEyebrow:
            next.module.id === hit.module.id ? "המשך ביחידה" : `היחידה הבאה: ${displayModuleTitleHe(next.module)}`,
        }
      : null;
  const kindLabel =
    hit.lesson.kind === "video" ? "וידאו" : hit.lesson.kind === "text" ? "קריאה" : "שיעור מעורב";

  let mode: "markdown" | "blocks" | "vocab" = "markdown";
  let flow: UnifiedFlowItem[] = [];
  let intro = "";

  if (md && !md.ok) {
    /* נשאיר body ריק; האזהרה למטה */
  } else if (hasBlocks) {
    mode = "blocks";
    flow = contentBlocksToPremiumFlow(content.blocks) as UnifiedFlowItem[];
    intro = buildBlockIntro(content.blocks);
  } else if (md?.ok && useVocabUi && lessonBody) {
    mode = "vocab";
    intro = markdownishToPlain(lessonBody, 360);
  } else if (md?.ok && lessonBody) {
    mode = "markdown";
    const { intro: inIntro, sections } = splitMarkdownIntoSections(lessonBody, hit.lesson.title);
    intro = inIntro;
    const sectionItems = unifiedSectionsToFlow(sections);
    if (hit.lesson.id === "lesson.intro.welcome") {
      flow = [...sectionItems, { kind: "gate" }];
    } else if (hit.lesson.id === "lesson.intro.roadmap") {
      flow = sectionItems;
    } else if (questionGroup || simulationRuntimeId) {
      // שיעורי תרגול/סימולציה: בלי gates - הסבר ואז שאלות אינטראקטיביות
      flow = sectionItems;
    } else {
      flow = interleaveMarkdownGates(sections).map((x): UnifiedFlowItem => {
        if ("kind" in x && x.kind === "gate") {
          return { kind: "gate" };
        }
        const s = x as PremiumMarkdownSection;
        return {
          kind: "section",
          id: s.id,
          title: s.heading,
          variant: s.variant,
          body: s.body,
        };
      });
    }
  }

  if (questionGroup && hasInteractiveQuestions) {
    flow = [
      ...flow,
      {
        kind: "questions",
        id: `inline-questions-${questionGroup.tag}`,
        title: "תרגול אינטראקטיבי",
        questionIds: groupQuestions.map((q) => q.id),
        timeLimitSec: questionGroup.timeLimitSec,
      },
    ];
  }
  if (simulationRuntimeId) {
    flow = [
      ...flow,
      {
        kind: "section",
        id: "simulation-runtime-cta",
        title: "סימולציה אינטראקטיבית",
        variant: "insight",
        body: `הסימולציה המלאה רצה בסביבה אינטראקטיבית עם טיימר לכל פרק, בדיוק כמו במבחן האמיתי.\n\n[▶ התחלת הסימולציה האינטראקטיבית](${BASE}/simulation/${simulationRuntimeId})`,
      },
    ];
  }

  const practiceHref = hit.lesson.practiceSetId ? `${BASE}/practice/${hit.lesson.practiceSetId}` : null;
  const quizHref = hit.lesson.quizId ? `${BASE}/quiz/${hit.lesson.quizId}` : null;

  const showPremiumWorkspace = hasBlocks || Boolean(md?.ok && lessonBody);

  return (
    <div className="min-h-screen w-full max-w-none bg-slate-50/50 pb-16 [direction:rtl]">
      <AmirantCourseLessonScopeTracker lessonId={hit.lesson.id} />
      <nav className="text-xs font-medium text-muted [direction:rtl]">
        <Link href={BASE} className="transition hover:text-primary">
          הכנה לאמירנט
        </Link>
        <span className="mx-2 text-line">/</span>
        <Link href={`${BASE}/module/${hit.module.slug}`} className="text-ink transition hover:text-primary">
          {displayModuleTitleHe(hit.module)}
        </Link>
      </nav>

      {cmsVideoUrl || hit.lesson.videoPath || hit.lesson.videoSlot ? (
        <div className="mt-6">
          <AmirantVideoEmbed
            src={cmsVideoUrl ?? hit.lesson.videoPath ?? null}
            title={`סרטון הסבר - ${hit.lesson.title}`}
          />
        </div>
      ) : null}

      {md && !md.ok ? (
        <Card className="mt-6 border-amber-500/35 bg-amber-500/[0.08]">
          <CardBody className="p-4 text-sm text-amber-950 [direction:rtl]">
            לא נמצא קובץ התוכן. בדקו: <code className="rounded bg-paper px-1">content/amirnet-course/{content.amirnetMarkdownRel}</code> או{" "}
            <code className="rounded bg-paper px-1">docs/amirnet-prep/</code> עם אותו שם קובץ.
          </CardBody>
        </Card>
      ) : null}

      {showPremiumWorkspace ? (
        <div className="mt-8">
          <AmirantPremiumLessonView
            lessonId={hit.lesson.id}
            title={hit.lesson.title}
            kindLabel={kindLabel}
            estimatedMinutes={hit.lesson.estimatedMinutes}
            intro={intro}
            flow={flow}
            mode={mode}
            vocabData={useVocabUi && vocabParsed ? vocabParsed : undefined}
            practiceHref={practiceHref}
            quizHref={quizHref}
            nextLessonHref={next ? `${BASE}/lesson/${next.lesson.id}` : null}
            nextLessonTitle={next?.lesson.title ?? null}
            courseHomeHref={BASE}
            sidebarNextLesson={sidebarNextLesson}
          />
        </div>
      ) : null}

      {!showPremiumWorkspace ? (
        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line/80 pt-8 [direction:rtl]">
          {prev ? (
            <Link
              href={`${BASE}/lesson/${prev.lesson.id}`}
              className={cn(
                "group flex max-w-[48%] flex-col rounded-lg border border-line/80 bg-paper px-4 py-3 shadow-card transition hover:border-primary/40",
              )}
            >
              <span className="text-xs text-muted">הקודם</span>
              <span className="mt-1 text-sm font-semibold text-ink group-hover:text-primary">{prev.lesson.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`${BASE}/lesson/${next.lesson.id}`}
              className="group flex max-w-[48%] flex-col items-end rounded-lg border border-line/80 bg-paper px-4 py-3 text-end shadow-card transition hover:border-primary/40"
            >
              <span className="text-xs text-muted">הבא</span>
              <span className="mt-1 text-sm font-semibold text-ink group-hover:text-primary">{next.lesson.title}</span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
