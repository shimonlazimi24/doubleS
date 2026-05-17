import Link from "next/link";
import type { ManifestLesson, ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import {
  getPracticeSetForLevel,
  getPrimaryAdaptiveQuiz,
  getSecondaryAdaptiveQuizzes,
  getSentenceCompletionGuideLessons,
  getSentenceCompletionVideoLessons,
  isSentenceCompletionModule,
} from "@/lib/amirant-course/practice-module-structure";
import { Card, CardBody, Heading, Text } from "@/components/ui";
const kindLabelHe = (kind: string) => {
  if (kind === "video") return "וידאו";
  if (kind === "text") return "מדריך כתוב";
  return "מעורב";
};

function guideLessons(lessons: ManifestLesson[]): ManifestLesson[] {
  return lessons.filter((l) => l.kind === "text");
}

function mediaLessons(lessons: ManifestLesson[]): ManifestLesson[] {
  return lessons.filter((l) => l.kind === "video" || l.kind === "mixed");
}

const NAV = [
  { id: "amirant-pm-guide", short: "מדריך" },
  { id: "amirant-pm-media", short: "וידאו / אודיו" },
  { id: "amirant-pm-easy", short: "קל" },
  { id: "amirant-pm-mid", short: "בינוני" },
  { id: "amirant-pm-hard", short: "מתקדם" },
  { id: "amirant-pm-adaptive", short: "אדפטיבי" },
] as const;

const COMING_PRACTICE =
  "סט ייעודי לרמה זו עדיין אינו מופיע במניפסט. בינתיים, המבחן האדפטיבי ממקם אותכם בקושי דינמי לפי ביצועים — ראו בקטע המבחן.";

type Props = {
  mod: ManifestModule;
  courseBase: string;
};

/**
 * Syllabus-aligned path for practice modules 3–5. Uses only manifest data; no invented content.
 */
export function AmirantPracticeModuleLearningPath({ mod, courseBase }: Props) {
  const sc = isSentenceCompletionModule(mod);
  const g = sc ? getSentenceCompletionGuideLessons(mod.lessons) : guideLessons(mod.lessons);
  const m = sc ? getSentenceCompletionVideoLessons(mod.lessons) : mediaLessons(mod.lessons);
  const primaryQ = getPrimaryAdaptiveQuiz(mod);
  const moreQs = getSecondaryAdaptiveQuizzes(mod);
  const easyP = getPracticeSetForLevel(mod, "easy");
  const intP = getPracticeSetForLevel(mod, "intermediate");
  const hardP = getPracticeSetForLevel(mod, "hard");

  return (
    <section className="space-y-5" aria-labelledby="amirant-pm-structured">
      <div>
        <Heading id="amirant-pm-structured" level={2} className="text-lg">
          {sc ? "שלב 3 — מסלול «השלמת משפטים»" : "מסלול למידה מובנה"}
        </Heading>
        <p className="mt-1 text-sm text-muted">
          {sc
            ? "לפי הסילבוס: מדריך כתוב + אודיו (במסמכים) → סרטון/תסריט → מקבצי שאלות (קל · בינוני · גבוה) → מבחן אדפטיבי (רמה משתנה)."
            : "שישה שלבים: מדריך → מדיה → שלוש רמות תרגול (אם הוגדרו) → מבחן אדפטיבי."}
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-1.5 rounded-2xl border border-line/60 bg-surface-low/40 p-1.5 text-xs font-medium"
        aria-label="קפיצה מהירה בין שלבים"
      >
        {NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="rounded-lg px-2.5 py-1.5 text-primary transition hover:bg-primary/10"
          >
            {item.short}
          </a>
        ))}
      </nav>

      <ol className="space-y-4" role="list">
        <li>
          <Card id="amirant-pm-guide" className="scroll-mt-6 border-line/80 shadow-sm">
            <CardBody className="space-y-3 p-4">
              <div className="flex items-baseline gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white"
                  aria-hidden
                >
                  1
                </span>
                <Heading level={3} className="text-base">
                  {sc ? "מדריך (כתוב) + אודיו" : "מדריך"}
                </Heading>
              </div>
              {g.length > 0 ? (
                <ul className="space-y-2">
                  {g.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`${courseBase}/lesson/${lesson.id}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {lesson.title}
                      </Link>
                      <Text as="span" variant="caption" className="ms-1 text-muted">
                        · {kindLabelHe(lesson.kind)}
                        {lesson.estimatedMinutes != null ? ` · ~${lesson.estimatedMinutes} דק׳` : null}
                      </Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text as="p" variant="bodySm" className="text-muted">
                  {sc
                    ? "הגדירו במניפסט שיעורי 4.2/4.3. קבצי MD אמורים לכלול הוראות אודיו כאשר הן קיימות."
                    : "אין כרגע שיעור מסומן כמדריך טקסטי בלבד. חומר מודרך עשוי להופיע במקטע מדיה או אחרי עדכון."}
                </Text>
              )}
            </CardBody>
          </Card>
        </li>

        <li>
          <Card id="amirant-pm-media" className="scroll-mt-6 border-line/80 shadow-sm">
            <CardBody className="space-y-3 p-4">
              <div className="flex items-baseline gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white"
                  aria-hidden
                >
                  2
                </span>
                <Heading level={3} className="text-base">
                  {sc ? "סרטון הדרכה" : "וידאו / אודיו"}
                </Heading>
              </div>
              {m.length > 0 ? (
                <ul className="space-y-2">
                  {m.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`${courseBase}/lesson/${lesson.id}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {lesson.title}
                      </Link>
                      <Text as="span" variant="caption" className="ms-1 text-muted">
                        · {kindLabelHe(lesson.kind)}
                        {lesson.estimatedMinutes != null ? ` · ~${lesson.estimatedMinutes} דק׳` : null}
                      </Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text as="p" variant="bodySm" className="text-muted">
                  {sc
                    ? "הוסיפו שיעור וידאו/תסריט (למשל lesson.sc.03) במניפסט, או העלו מדיה היכן שמקושר בקורס."
                    : "אין שיעורי וידאו או מעורב מוגדרים — ניתן להמשיך לתרגול ולמבחן האדפטיבי."}
                </Text>
              )}
            </CardBody>
          </Card>
        </li>

        <li>
          <LevelPracticeCard
            step={3}
            id="amirant-pm-easy"
            title={sc ? "מקבצי שאלות — רמה קלה" : "תרגול — קל"}
            set={easyP}
            courseBase={courseBase}
            primaryQuizHref={primaryQ ? `${courseBase}/quiz/${primaryQ.id}` : null}
          />
        </li>
        <li>
          <LevelPracticeCard
            step={4}
            id="amirant-pm-mid"
            title={sc ? "מקבצי שאלות — רמה בינונית" : "תרגול — בינוני"}
            set={intP}
            courseBase={courseBase}
            primaryQuizHref={primaryQ ? `${courseBase}/quiz/${primaryQ.id}` : null}
          />
        </li>
        <li>
          <LevelPracticeCard
            step={5}
            id="amirant-pm-hard"
            title={sc ? "מקבצי שאלות — רמה גבוהה" : "תרגול — מתקדם"}
            set={hardP}
            courseBase={courseBase}
            primaryQuizHref={primaryQ ? `${courseBase}/quiz/${primaryQ.id}` : null}
          />
        </li>

        <li>
          <Card id="amirant-pm-adaptive" className="scroll-mt-6 border border-primary/25 bg-primary/[0.04] shadow-sm">
            <CardBody className="space-y-3 p-4">
              <div className="flex items-baseline gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white"
                  aria-hidden
                >
                  6
                </span>
                <Heading level={3} className="text-base">
                  {sc ? "מבחנים (רמה משתנה) — אדפטיבי" : "מבחן אדפטיבי"}
                </Heading>
              </div>
              {primaryQ ? (
                <div>
                  <Link
                    href={`${courseBase}/quiz/${primaryQ.id}`}
                    className="inline-flex rounded-control border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  >
                    {primaryQ.title}
                  </Link>
                  <Text as="p" variant="caption" className="mt-2 text-muted">
                    {sc
                      ? "האדפטציה בוחרת בקשיי משתנה. אחרי הבוחן: משוב ו־"
                      : "המבחן (אדפטיבי). אחרי הבוחן: משוב ו־"}
                    <Link className="font-medium text-primary underline-offset-2 hover:underline" href={`${courseBase}/review`}>
                      סקירה
                    </Link>
                    .
                  </Text>
                </div>
              ) : (
                <Text as="p" variant="bodySm" className="text-muted">
                  אין מבחן מקושר למודול בקובץ המניפסט.
                </Text>
              )}
              {moreQs.length > 0 ? (
                <div className="border-t border-line/60 pt-2">
                  <Text as="p" variant="caption" className="mb-1 font-medium text-ink">
                    מבחנים נוספים (אותו מנוע, תמה משולבת)
                  </Text>
                  <ul className="flex flex-wrap gap-2">
                    {moreQs.map((q) => (
                      <li key={q.id}>
                        <Link
                          href={`${courseBase}/quiz/${q.id}`}
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {q.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </li>
      </ol>
    </section>
  );
}

function LevelPracticeCard({
  step,
  id,
  title,
  set,
  courseBase,
  primaryQuizHref,
}: {
  step: number;
  id: string;
  title: string;
  set: { id: string; title: string } | null;
  courseBase: string;
  primaryQuizHref: string | null;
}) {
  return (
    <Card id={id} className="scroll-mt-6 border-line/80 shadow-sm">
      <CardBody className="space-y-3 p-4">
        <div className="flex items-baseline gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white"
            aria-hidden
          >
            {step}
          </span>
          <Heading level={3} className="text-base">
            {title}
          </Heading>
        </div>
        {set ? (
          <div>
            <Link
              href={`${courseBase}/practice/${set.id}`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {set.title}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <Text as="p" variant="bodySm" className="text-muted">
              {COMING_PRACTICE}
            </Text>
            {primaryQuizHref ? (
              <Link
                href={primaryQuizHref}
                className="inline text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                עבור למבחן אדפטיבי
              </Link>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
