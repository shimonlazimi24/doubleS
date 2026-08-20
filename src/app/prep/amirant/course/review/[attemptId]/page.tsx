import Link from "next/link";
import type { Metadata } from "next";
import { Container, Text } from "@/components/ui";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { loadQuizReviewData } from "@/lib/amirant-course/student-insights";
import { AmirantQuizReviewView } from "@/components/prep/amirant-course/AmirantQuizReviewView";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

export const metadata: Metadata = {
  title: "סקירת בוחן | הכנה לאמירנט",
};

function StateNotice({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Container max="measureWide">
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-paper p-8 text-center" dir="rtl">
        <Text as="p" variant="body" className="font-semibold text-ink">
          {title}
        </Text>
        <Text as="p" variant="bodySm" className="mt-2 text-muted">
          {body}
        </Text>
        <Link
          href={ctaHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          {ctaLabel}
        </Link>
      </div>
    </Container>
  );
}

export default async function AmirantCourseReviewAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return (
      <StateNotice
        title="הסקירה לא זמינה כרגע"
        body="נסו לרענן בעוד רגע, או חזרו לרשימת הבוחנים."
        ctaHref={`${COURSE_BASE}/review`}
        ctaLabel="לרשימת הבוחנים"
      />
    );
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return (
      <StateNotice
        title="סקירה מלאה זמינה אחרי התחברות"
        body="התחברו כדי לראות את פירוט הטעויות וההסברים לכל שאלה בניסיון הזה."
        ctaHref={`${PREP_BASE}/login?next=${COURSE_BASE}/review/${attemptId}`}
        ctaLabel="התחברות"
      />
    );
  }

  const review = await loadQuizReviewData(client, user.id, attemptId);
  if (!review) {
    return (
      <StateNotice
        title="הניסיון לא נמצא"
        body="ייתכן שהקישור ישן או שהניסיון נעשה ממכשיר אחר. כל הניסיונות שלכם מרוכזים ברשימה."
        ctaHref={`${COURSE_BASE}/review`}
        ctaLabel="לרשימת הבוחנים"
      />
    );
  }

  return (
    <Container max="measureWide">
      <AmirantQuizReviewView review={review} />
    </Container>
  );
}
