import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { AmirantCourseAnalyticsClient } from "@/components/prep/amirant-course/AmirantCourseAnalyticsClient";
import { requireAmirantFullAccess } from "@/lib/prep/amirant-course-access.server";

export const metadata: Metadata = {
  title: "אנליטיקה | הכנה לאמירנט",
};

export default async function AmirantCourseAnalyticsPage() {
  await requireAmirantFullAccess();
  return (
    <Container max="measureWide">
      <AmirantCourseAnalyticsClient />
    </Container>
  );
}
