import type { Metadata } from "next";
import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
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
import {
  getLessonQuestionGroup,
  SIMULATION_LESSON_RUNTIME,
  WORD_FORMATION_LESSONS,
} from "@/lib/amirant-course/lesson-content/lesson-question-groups";
import { getWordFormationTest } from "@/lib/amirant-course/word-formation/word-formation.server";
import { stripQuestionSections } from "@/lib/amirant-course/lesson-content/strip-question-sections";
import { splitLessonTitle } from "@/lib/amirant-course/lesson-content/module-lesson-groups";
import { getBankQuestionsByTag } from "@/lib/amirant-course/question-bank";
import { parseVocabularyMarkdown, vocabularyBodyHasNumberedWordEntries } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";
import { readAmirantCourseMarkdownSource } from "@/lib/prep/amirnet-materials.server";
import { attachAnswersToQuestions } from "@/lib/amirant-course/lesson-content/attach-answers-to-questions";
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
  // The nine markdown restatement quizzes were replaced by the owner's 14 sets.
  // Bookmarks and "continue where you left off" may still hold the old ids.
  "lesson.rephrase.04": "lesson.rephrase.set-01",
  "lesson.rephrase.05": "lesson.rephrase.set-02",
  "lesson.rephrase.06": "lesson.rephrase.set-03",
  "lesson.rephrase.07": "lesson.rephrase.set-04",
  "lesson.rephrase.08": "lesson.rephrase.set-05",
  "lesson.rephrase.09": "lesson.rephrase.set-06",
  "lesson.rephrase.10": "lesson.rephrase.set-07",
  "lesson.rephrase.11": "lesson.rephrase.set-08",
  "lesson.rephrase.12": "lesson.rephrase.set-09",
  // The multiple-choice word-formation practice (7.5) was replaced by the owner's typed tests.
  "lesson.reform.05": "lesson.reform.wf-01",
  // Likewise the eight sentence-completion quizzes and nine reading quizzes.
  "lesson.sc.04": "lesson.sc.test-01",
  "lesson.sc.05": "lesson.sc.test-02",
  "lesson.sc.06": "lesson.sc.test-03",
  "lesson.sc.07": "lesson.sc.test-04",
  "lesson.sc.08": "lesson.sc.test-05",
  "lesson.sc.09": "lesson.sc.test-06",
  "lesson.sc.10": "lesson.sc.test-07",
  "lesson.sc.11": "lesson.sc.test-08",
  "lesson.reading.04": "lesson.reading.passage-01",
  "lesson.reading.05": "lesson.reading.passage-02",
  "lesson.reading.06": "lesson.reading.passage-03",
  "lesson.reading.07": "lesson.reading.passage-04",
  "lesson.reading.08": "lesson.reading.passage-05",
  "lesson.reading.09": "lesson.reading.passage-06",
  "lesson.reading.10": "lesson.reading.passage-07",
  "lesson.reading.11": "lesson.reading.passage-08",
  "lesson.reading.12": "lesson.reading.passage-09",
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
  const { name, level } = splitLessonTitle(hit.lesson.title);
  return { title: `${name}${level ? ` · ${level}` : ""} | ${hit.module.title}` };
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

  const rawMd = isCmsOverride && cmsMarkdown
    ? { ok: true as const, body: cmsMarkdown }
    : (hasMd && content.amirnetMarkdownRel ? readAmirantCourseMarkdownSource(content.amirnetMarkdownRel) : null);
  // Practice files are written like a printed booklet — every question, then a
  // solutions section — so an answer could land dozens of cards after its
  // question ("עד שהגעתי לתשובות שכחתי מה הייתה השאלה"). Pair them before the
  // body is split into slides. Display only: the source file is untouched, and
  // the admin editor still loads the raw markdown.
  const md = rawMd?.ok
    ? { ...rawMd, body: attachAnswersToQuestions(rawMd.body) }
    : rawMd;
  // שיעורי "מבחן תרגול": השאלות השטוחות נחתכות מה-md ומרונדרות כרכיב אינטראקטיבי מהבנק.
  // חותכים רק אם קבוצת השאלות באמת נמצאה בבנק - אחרת (תג הוסב / מאגר נכשל)
  // עדיף להשאיר את השאלות כטקסט מאשר שיעור בלי שאלות בכלל.
  const questionGroup = getLessonQuestionGroup(params.lessonId);
  const groupQuestions = questionGroup ? getBankQuestionsByTag(questionGroup.tag) : [];
  const hasInteractiveQuestions = groupQuestions.length > 0;
  const simulationRuntimeId = SIMULATION_LESSON_RUNTIME[params.lessonId] ?? null;
  const wordFormation = WORD_FORMATION_LESSONS[params.lessonId] ?? null;
  const wordFormationItems = wordFormation ? getWordFormationTest(wordFormation.test) : [];
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
  } else if (md?.ok && useVocabUi && lessonBody && vocabParsed) {
    mode = "vocab";
    // מבוא נגזר ולא השטחת ה-MD הגולמי (טבלאות/אימוג'י נראו כזבל); המבנה המלא מוצג ממילא בחוויית המילים.
    intro = `${vocabParsed.allEntries.length} מילים ללמידה בכרטיסים - עם הגדרות, דוגמאות וטיפים לזכירה. עברו לפי הסדר או סננו לפי קטגוריה.`;
  } else if (md?.ok && lessonBody) {
    mode = "markdown";
    const { intro: inIntro, sections } = splitMarkdownIntoSections(lessonBody, hit.lesson.title);
    intro = inIntro;
    const sectionItems = unifiedSectionsToFlow(sections);
    if (hit.lesson.id === "lesson.intro.welcome") {
      flow = [...sectionItems, { kind: "gate" }];
    } else if (hit.lesson.id === "lesson.intro.roadmap") {
      flow = sectionItems;
    } else if (questionGroup || simulationRuntimeId || wordFormation) {
      // שיעורי תרגול/סימולציה: בלי gates - הסבר ואז שאלות אינטראקטיביות
      // A set whose markdown is only a short introduction (no `##` sections) is
      // already shown in full by the intro step; the single synthetic section
      // would repeat the same text as a second slide before the questions.
      const introOnly = !/^##\s+/m.test(lessonBody) && !inIntro.endsWith("…");
      flow = introOnly ? [] : sectionItems;
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
  if (wordFormation && wordFormationItems.length > 0) {
    flow = [
      ...flow,
      {
        kind: "questions",
        id: `word-formation-${wordFormation.test}`,
        title: "יצירת מילה",
        questionIds: [],
        timeLimitSec: wordFormation.timeLimitSec,
        wordFormation: wordFormationItems,
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
    <div className="min-h-screen w-full max-w-none bg-paper pb-16 [direction:rtl]">
      <AmirantCourseLessonScopeTracker lessonId={hit.lesson.id} />
      {/* The place in the course is in the syllabus rail and the lesson header; no breadcrumb bar above the workspace. */}

      {/* וידאו רק כשהוא קיים באמת - פס "בקרוב" על כל שיעור הוא הבטחה ריקה,
          לא פרימיום (DESIGN_GUIDELINES: any element with no functional purpose) */}
      {cmsVideoUrl || hit.lesson.videoPath ? (
        <div className="mx-auto mt-6 max-w-[54rem] px-4 sm:px-6">
          <AmirantVideoEmbed
            src={cmsVideoUrl ?? hit.lesson.videoPath ?? null}
            title={`סרטון הסבר - ${hit.lesson.title}`}
          />
        </div>
      ) : null}

      {md && !md.ok ? (
        <Card className="mx-auto mt-6 max-w-[54rem] border-amber-500/35 bg-amber-500/[0.08]">
          <CardBody className="p-4 text-sm text-amber-950 [direction:rtl]">
            לא נמצא קובץ התוכן. בדקו: <code className="rounded bg-paper px-1">content/amirnet-course/{content.amirnetMarkdownRel}</code> או{" "}
            <code className="rounded bg-paper px-1">docs/amirnet-prep/</code> עם אותו שם קובץ.
          </CardBody>
        </Card>
      ) : null}

      {showPremiumWorkspace ? (
        <div className="mt-2">
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
