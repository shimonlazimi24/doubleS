import Link from "next/link";
import type { CourseManifest, ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import { displayModuleTitleHe, getSyllabusUiForModule } from "@/lib/amirant-course";
import { isStructuredPracticeModule } from "@/lib/amirant-course/practice-module-structure";
import { AmirantCourseOverallProgress } from "@/components/prep/amirant-course/AmirantCourseOverallProgress";
import { AmirantModuleProgressCard } from "@/components/prep/amirant-course/AmirantModuleProgressCard";
import { AmirantPracticeModuleLearningPath } from "@/components/prep/amirant-course/AmirantPracticeModuleLearningPath";
import { Card, CardBody, Heading, Text } from "@/components/ui";

const kindLabelHe = (kind: string) => {
  if (kind === "video") return "וידאו";
  if (kind === "text") return "מדריך כתוב";
  return "מעורב (מדריך + וידאו)";
};

type Props = {
  module: ManifestModule;
  manifest: CourseManifest;
  courseBase: string;
};

/**
 * Module hub: syllabus copy + links to existing lesson/practice/quiz/simulation routes only.
 */
export function AmirantModuleHub({ module: mod, manifest, courseBase }: Props) {
  const ui = getSyllabusUiForModule(mod);
  const titleHe = displayModuleTitleHe(mod);
  const structuredPractice = isStructuredPracticeModule(mod);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 [direction:rtl] sm:grid-cols-2">
        <AmirantCourseOverallProgress className="mb-0" />
        <AmirantModuleProgressCard module={mod} moduleTitleHe={titleHe} className="mb-0" />
      </div>

      <div>
        <nav className="text-xs font-medium text-muted">
          <Link href={courseBase} className="transition hover:text-primary">
            Amirant Preparation
          </Link>
          <span className="mx-2 text-line">/</span>
          <span className="text-ink">{titleHe}</span>
        </nav>
        <Heading level={1} className="mt-4 text-2xl md:text-3xl">
          {titleHe}
        </Heading>
        {ui?.oneLinerHe ? (
          <Text as="p" variant="bodySm" className="mt-2 max-w-readable text-muted">
            {ui.oneLinerHe}
          </Text>
        ) : null}
      </div>

      <section className="space-y-3">
        <Heading level={2} className="text-lg">
          הסבר והתקדמות
        </Heading>
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
          {(ui?.howToHe?.length
            ? ui.howToHe
            : ["התקדמו לפי שיעורי המודול, ואז תרגול ומבחנים — כפי שמופיעים למטה."]).map((p) => (
            <li key={p} className="ps-1 marker:text-primary/60">
              {p}
            </li>
          ))}
        </ul>
      </section>

      {structuredPractice ? <AmirantPracticeModuleLearningPath mod={mod} courseBase={courseBase} /> : null}

      {ui?.kind === "vocabulary" && ui.levelLabelsHe ? (
        <section className="space-y-3">
          <Heading level={2} className="text-lg">
            רמות (מסלול מודול)
          </Heading>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { key: "easy" as const, label: "קל" },
                { key: "medium" as const, label: "בינוני" },
                { key: "hard" as const, label: "קשה" },
              ] as const
            ).map(({ key, label }) => (
              <Card key={key} className="border-line/80">
                <CardBody className="space-y-2 p-4 text-sm">
                  <p className="font-semibold text-ink">{label}</p>
                  <p className="text-xs text-muted">{ui.levelLabelsHe![key]}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          {ui.contentNotesHe?.length ? (
            <Text as="p" variant="caption" className="text-muted">
              {ui.contentNotesHe.join(" ")}
            </Text>
          ) : null}
        </section>
      ) : null}

      {ui?.reformBulletsHe?.length ? (
        <section className="space-y-3">
          <Heading level={2} className="text-lg">
            מקטעי 2026
          </Heading>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            {ui.reformBulletsHe.map((b) => (
              <li key={b} className="ps-1 marker:text-primary/60">
                {b}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {structuredPractice ? null : (
        <>
          {mod.lessons.length > 0 ? (
            <section className="space-y-3">
              <Heading level={2} className="text-lg">
                שיעורים
              </Heading>
              <p className="text-sm text-muted">
                לכל שיעור: <strong className="font-medium text-ink">מדריך</strong> (טקסט) / <strong className="font-medium text-ink">וידאו</strong> / <strong className="font-medium text-ink">מעורב</strong> — לפי
                סוג בקורס. אודיו/וידאו מורחב יתווספו לפי אספקת קבצים.
              </p>
              <ol className="space-y-2">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`${courseBase}/lesson/${lesson.id}`}
                      className="group flex flex-wrap items-baseline justify-between gap-2 rounded-control border border-line/70 bg-paper px-3 py-2.5 text-sm font-medium text-primary transition hover:border-primary/40"
                    >
                      <span>
                        {lesson.title}
                        <span className="ms-2 text-xs font-normal text-muted">· {kindLabelHe(lesson.kind)}</span>
                      </span>
                      {lesson.estimatedMinutes != null ? (
                        <span className="text-xs tabular-nums text-muted">~{lesson.estimatedMinutes} דק׳</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {mod.practiceSets.length > 0 || mod.quizzes.length > 0 ? (
            <section className="space-y-3">
              <Heading level={2} className="text-lg">
                תרגול · מבחנים · אדפטיבי
              </Heading>
              <p className="text-sm text-muted">
                מבחנים אדפטיביים מסוננים לפי מנגנון הקורס. אחרי בוחן — משוב בדף ותובנות;{" "}
                <Link className="font-medium text-primary underline-offset-2 hover:underline" href={`${courseBase}/review`}>
                  סקירה
                </Link>
                .
              </p>
              {mod.practiceSets.length > 0 ? (
                <div>
                  <Text as="p" variant="caption" className="mb-2 font-medium text-ink">
                    סטי תרגול
                  </Text>
                  <ul className="flex flex-wrap gap-2">
                    {mod.practiceSets.map((ps) => (
                      <li key={ps.id}>
                        <Link
                          href={`${courseBase}/practice/${ps.id}`}
                          className="inline-block rounded-full border border-line/80 bg-surface-low px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                        >
                          {ps.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {mod.quizzes.length > 0 ? (
                <div>
                  <Text as="p" variant="caption" className="mb-2 font-medium text-ink">
                    מבחנים
                  </Text>
                  <ul className="flex flex-wrap gap-2">
                    {mod.quizzes.map((q) => (
                      <li key={q.id}>
                        <Link
                          href={`${courseBase}/quiz/${q.id}`}
                          className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
                        >
                          {q.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {ui?.kind === "vocabulary" ? (
                    <div className="mt-3 rounded-surface border border-line/50 bg-surface-low/30 p-3 [direction:rtl] [text-align:start]">
                      <p className="text-sm font-semibold text-ink">מבחנים עצמיים — לפי סוג או מעורב</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">
                        במבחנים הכוללים אוצר מילים: אפשר לפתוח את אותו בוחן עם{" "}
                        <code className="rounded bg-paper px-0.5 text-[0.7rem]" dir="ltr" translate="no">
                          ?vocab=…
                        </code>{" "}
                        כדי להתמקד בפעלים, שמות עצם, תוארים, מילות קישור, או ביטויים; ללא הפרמטר (או
                        <code className="mx-0.5" dir="ltr" translate="no">
                          ?vocab=mixed
                        </code>
                        ) = מעורב.
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-ink/95">
                        {mod.quizzes
                          .filter((q) => (q.topicSlugs ?? []).includes("vocabulary"))
                          .map((q) => (
                            <li key={q.id} className="border-b border-line/30 pb-2 last:border-0 last:pb-0">
                              <p className="text-xs text-muted">{q.title}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 [text-align:start]">
                                {(
                                  [
                                    { label: "מעורב", param: "mixed" as const },
                                    { label: "פעלים", param: "verbs" as const },
                                    { label: "שמות עצם", param: "nouns" as const },
                                    { label: "תוארים", param: "adjectives" as const },
                                    { label: "ת״מ/קישור", param: "adverbs" as const },
                                    { label: "ביטויים", param: "phrasal" as const },
                                  ] as const
                                ).map((opt, i) => (
                                  <span key={opt.param}>
                                    {i > 0 ? <span className="text-line">|</span> : null}
                                    <Link
                                      href={
                                        opt.param === "mixed"
                                          ? `${courseBase}/quiz/${q.id}`
                                          : `${courseBase}/quiz/${q.id}?vocab=${opt.param}`
                                      }
                                      className="font-medium text-primary underline-offset-2 hover:underline"
                                    >
                                      {opt.label}
                                    </Link>
                                  </span>
                                ))}
                              </p>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {ui?.kind === "simulations" ? (
        <section className="space-y-3">
          <Heading level={2} className="text-lg">
            סימולציות מלאות · זמן · ניתוח
          </Heading>
          <p className="text-sm text-muted">
            מבחן מלא בזמן, פיילוט, ומקטעי ציון — לפי הגדרת הסימולציה. אחרי הסיום: ניתוח בזרימת הקורס, ו־
            <Link className="font-medium text-primary underline-offset-2 hover:underline" href={`${courseBase}/analytics`}>
              אנליטיקה
            </Link>
            .
          </p>
          <ul className="space-y-2">
            {manifest.simulations.map((s) => (
              <li key={s.id}>
                <Link
                  href={`${courseBase}/simulation/${s.id}`}
                  className="block rounded-control border border-line/80 bg-paper p-4 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
          {ui.contentNotesHe?.map((n) => (
            <Text key={n} as="p" variant="caption" className="text-muted">
              {n}
            </Text>
          )) ?? null}
        </section>
      ) : null}
    </div>
  );
}
