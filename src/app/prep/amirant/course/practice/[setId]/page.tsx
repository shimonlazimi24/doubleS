import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getManifestPracticeSet } from "@/lib/amirant-course";
import { Container } from "@/components/ui";
import { AmirantPracticeSetClient } from "@/components/prep/amirant-course/AmirantPracticeSetClient";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";

type Props = { params: { setId: string } };

export function generateMetadata({ params }: Props): Metadata {
  const hit = getManifestPracticeSet(params.setId);
  if (!hit) return { title: "תרגול" };
  return { title: `${hit.set.title} | הכנה לאמירנט` };
}

export default async function AmirantCoursePracticePage({ params }: Props) {
  await requireAmirantFullAccess(getManifestPracticeSet(params.setId)?.module.slug);
  const hit = getManifestPracticeSet(params.setId);
  if (!hit) notFound();
  return (
    <Container max="measureWide">
      <AmirantPracticeSetClient title={hit.set.title} questionIds={hit.set.questionIds} />
    </Container>
  );
}
