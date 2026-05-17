import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getManifestQuiz, parseVocabQuizParam } from "@/lib/amirant-course";
import { Container } from "@/components/ui";
import { AmirantAdaptiveQuizClient } from "@/components/prep/amirant-course/AmirantAdaptiveQuizClient";

type Props = {
  params: { quizId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export function generateMetadata({ params }: Props): Metadata {
  const q = getManifestQuiz(params.quizId);
  if (!q) return { title: "מבחן" };
  return { title: `${q.title} | Amirant Preparation` };
}

export default function AmirantCourseQuizPage({ params, searchParams }: Props) {
  const q = getManifestQuiz(params.quizId);
  if (!q) notFound();
  const vocabMode = parseVocabQuizParam(searchParams.vocab);
  return (
    <Container max="measureWide">
      <AmirantAdaptiveQuizClient manifestQuiz={q} vocabMode={vocabMode} />
    </Container>
  );
}
