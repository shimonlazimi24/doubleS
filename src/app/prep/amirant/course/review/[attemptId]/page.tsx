import type { Metadata } from "next";
import { Card, CardBody, Container, Text } from "@/components/ui";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { loadQuizReviewData } from "@/lib/amirant-course/student-insights";
import { AmirantQuizReviewView } from "@/components/prep/amirant-course/AmirantQuizReviewView";

export const metadata: Metadata = {
  title: "סקירת בוחן | Amirant Preparation",
};

export default async function AmirantCourseReviewAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const client = createPrepSupabaseServerClient();
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

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return (
      <Container max="measureWide">
        <Card>
          <CardBody className="p-6">
            <Text as="p" variant="body">
              צריך להתחבר כדי לראות סקירת בוחן.
            </Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const review = await loadQuizReviewData(client, user.id, attemptId);
  if (!review) {
    return (
      <Container max="measureWide">
        <Card>
          <CardBody className="p-6">
            <Text as="p" variant="body">
              הניסיון לא נמצא.
            </Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container max="measureWide">
      <AmirantQuizReviewView review={review} />
    </Container>
  );
}
