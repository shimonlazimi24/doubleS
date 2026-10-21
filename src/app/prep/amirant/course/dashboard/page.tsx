import type { Metadata } from "next";
import { Card, CardBody, Container, Text } from "@/components/ui";
import { getPrepServerUser } from "@/lib/prep/supabase/server";
import { loadStudentDashboardData } from "@/lib/amirant-course/student-insights";
import { AmirantStudentDashboardView } from "@/components/prep/amirant-course/AmirantStudentDashboardView";
import { AmirantDashboardFallbackClient } from "@/components/prep/amirant-course/AmirantDashboardFallbackClient";

export const metadata: Metadata = {
  title: "לוח תלמיד | הכנה לאמירנט",
};

export default async function AmirantCourseDashboardPage() {
  const { client, user } = await getPrepServerUser();
  if (!client) {
    return (
      <Container max="measureWide">
        <Card>
          <CardBody className="p-6">
            <Text as="p" variant="body">
              Supabase לא מוגדר כרגע.
            </Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container max="measureWide">
        <AmirantDashboardFallbackClient />
      </Container>
    );
  }

  const data = await loadStudentDashboardData(client, user.id);
  return <AmirantStudentDashboardView data={data} />;
}
