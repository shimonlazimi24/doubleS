import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { AmirantWeakQuizPageClient } from "@/components/prep/amirant-course/AmirantWeakQuizPageClient";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";

export const metadata: Metadata = {
  title: "תרגול ממוקד | הכנה לאמירנט",
};

export default async function AmirantCourseWeakQuizPage() {
  await requireAmirantFullAccess();
  return (
    <Container max="measureWide">
      <AmirantWeakQuizPageClient />
    </Container>
  );
}
