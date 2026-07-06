import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { AmirantCourseAnalyticsClient } from "@/components/prep/amirant-course/AmirantCourseAnalyticsClient";

export const metadata: Metadata = {
  title: "אנליטיקה | הכנה לאמירנט",
};

export default function AmirantCourseAnalyticsPage() {
  return (
    <Container max="measureWide">
      <AmirantCourseAnalyticsClient />
    </Container>
  );
}
