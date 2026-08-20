import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getManifestQuiz, parseVocabQuizParam } from "@/lib/amirant-course";
import { Container } from "@/components/ui";
import { AmirantAdaptiveQuizClient } from "@/components/prep/amirant-course/AmirantAdaptiveQuizClient";
import { AmirantPlacementQuizClient } from "@/components/prep/amirant-course/AmirantPlacementQuizClient";
import { requireAmirantQuizAccess } from "@/lib/prep/amirant-course-access.server";

type Props = {
  params: { quizId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

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
    return (
      <Container max="shell">
        <AmirantPlacementQuizClient manifestQuiz={q} />
      </Container>
    );
  }
  const vocabMode = parseVocabQuizParam(searchParams.vocab);
  return (
    <Container max="measureWide">
      <AmirantAdaptiveQuizClient manifestQuiz={q} vocabMode={vocabMode} />
    </Container>
  );
}
