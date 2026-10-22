import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getManifestQuiz, parseVocabQuizParam } from "@/lib/amirant-course";
import { filterBankByTopicsAndVocabMode } from "@/lib/amirant-course/question-bank";
import { clientQuestionSetFor, generalPoolForClient } from "@/lib/amirant-course/question-bank/for-client.server";
import { normalizeQuizTopicSlugs } from "@/lib/amirant-course/topic-labels";
import { Container } from "@/components/ui";
import { AmirantAdaptiveQuizClient } from "@/components/prep/amirant-course/AmirantAdaptiveQuizClient";
import { AmirantPlacementQuizClient } from "@/components/prep/amirant-course/AmirantPlacementQuizClient";
import { requireAmirantQuizAccess } from "@/lib/prep/amirant-course-access.server";

type Props = {
  params: { quizId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

/** The placement form draws from these three topics only (`build-placement-quiz-form.ts`). */
const PLACEMENT_TOPICS = new Set(["sentence_completion", "rephrasing", "reading_comprehension"]);

export function generateMetadata({ params }: Props): Metadata {
  const q = getManifestQuiz(params.quizId);
  if (!q) return { title: "מבחן" };
  return { title: `${q.title} | הכנה לאמירנט` };
}

export default async function AmirantCourseQuizPage({ params, searchParams }: Props) {
  const q = getManifestQuiz(params.quizId);
  if (!q) notFound();
  await requireAmirantQuizAccess(params.quizId);
  if (q.format === "fixed_placement") {
    // The free test: the browser gets ids, topics and levels to build its form
    // from, and fetches the 15 chosen questions by id. No question text here.
    const pool = generalPoolForClient().filter((row) => PLACEMENT_TOPICS.has(row.topicSlug));
    return (
      <Container max="shell">
        <AmirantPlacementQuizClient manifestQuiz={q} pool={pool} />
      </Container>
    );
  }
  const vocabMode = parseVocabQuizParam(searchParams.vocab);
  // The adaptive quiz picks its next question in the browser after each answer,
  // so it needs the general bank for its topics — and nothing outside them.
  const questionSet = clientQuestionSetFor(
    filterBankByTopicsAndVocabMode(normalizeQuizTopicSlugs(q.topicSlugs), vocabMode),
  );
  return (
    <Container max="measureWide">
      <AmirantAdaptiveQuizClient manifestQuiz={q} vocabMode={vocabMode} questionSet={questionSet} />
    </Container>
  );
}
