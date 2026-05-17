import Link from "next/link";
import { Card, CardBody, CardTitle, Text } from "@/components/ui";
import { amirantExamQuestionPromptForDisplay } from "@/lib/amirant-course";
import type { QuizReviewData } from "@/lib/amirant-course/student-insights";

export function AmirantQuizReviewView({ review }: { review: QuizReviewData }) {
  return (
    <div className="space-y-6">
      <Text as="h1" variant="titlePage">
        סקירת בוחן
      </Text>
      <Text as="p" variant="bodySm" className="text-muted">
        {review.quizId} · {review.scorePct != null ? `ציון ${review.scorePct}%` : "ללא ציון"} · ניסיון{" "}
        {review.attemptId}
      </Text>

      {review.mistakesByTopic.length === 0 ? (
        <Card>
          <CardBody className="p-6">
            <Text as="p" variant="body">
              לא נמצאו טעויות בניסיון הזה. עבודה מצוינת.
            </Text>
          </CardBody>
        </Card>
      ) : null}

      {review.mistakesByTopic.map((group) => (
        <Card key={group.topic}>
          <CardTitle>
            טעויות בנושא: {group.topicLabel} ({group.mistakes.length})
          </CardTitle>
          <CardBody className="space-y-4">
            {group.mistakes.map((m) => (
              <div key={m.questionId} className="rounded-control border border-line/70 bg-surface-low p-4">
                <Text as="p" variant="body" className="font-semibold text-ink">
                  {amirantExamQuestionPromptForDisplay(m.prompt)}
                </Text>
                <Text as="p" variant="bodySm" className="mt-2">
                  תשובתך: <span className="font-semibold text-ink">{m.selectedOptionLabel}</span>
                </Text>
                <Text as="p" variant="bodySm">
                  תשובה נכונה: <span className="font-semibold text-ink">{m.correctOptionLabel}</span>
                </Text>
                <Text as="p" variant="bodySm" className="mt-2 text-ink">
                  הסבר: {m.explanation}
                </Text>
                <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                  {m.lessonHref ? (
                    <Link href={m.lessonHref} className="text-primary">
                      לשיעור בנושא
                    </Link>
                  ) : null}
                  {m.practiceHref ? (
                    <Link href={m.practiceHref} className="text-primary">
                      תרגל נושא זה
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
