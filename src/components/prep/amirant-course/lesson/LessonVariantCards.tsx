import { LessonBlockCard, type LessonBlockCardProps } from "./LessonBlockCard";

type Omitted = Omit<LessonBlockCardProps, "variant">;

export function LessonTipCard(props: Omitted) {
  return <LessonBlockCard variant="tip" {...props} />;
}

export function LessonWarningCard(props: Omitted) {
  return <LessonBlockCard variant="warning" {...props} />;
}

export function LessonExampleCard(props: Omitted) {
  return <LessonBlockCard variant="example" {...props} />;
}

export function LessonKeyTakeawayCard(props: Omitted) {
  return <LessonBlockCard variant="key-takeaway" {...props} />;
}

export function LessonInsightCard(props: Omitted) {
  return <LessonBlockCard variant="insight" {...props} />;
}

export function LessonCommonMistakeCard(props: Omitted) {
  return <LessonBlockCard variant="common-mistake" {...props} />;
}
