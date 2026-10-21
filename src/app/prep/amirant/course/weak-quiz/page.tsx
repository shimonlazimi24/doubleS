import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { AmirantWeakQuizPageClient } from "@/components/prep/amirant-course/AmirantWeakQuizPageClient";
import { generalPoolForClient } from "@/lib/amirant-course/question-bank/for-client.server";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";

export const metadata: Metadata = {
  title: "תרגול ממוקד | הכנה לאמירנט",
};

export default async function AmirantCourseWeakQuizPage() {
  await requireAmirantFullAccess();
  // The local fallback picks by topic and level only; the pool carries no question text.
  const pool = generalPoolForClient().map((q) => ({ id: q.id, topicSlug: q.topicSlug, difficulty: q.difficulty }));
  return (
    <Container max="measureWide">
      <AmirantWeakQuizPageClient pool={pool} />
    </Container>
  );
}
