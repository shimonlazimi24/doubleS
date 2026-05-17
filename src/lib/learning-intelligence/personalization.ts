import type { CourseId, LessonId, QuizId, TopicId, UserId } from "./domain";
import type { LearnerTopicStats } from "./analytics";
import { isWeakTopic } from "./analytics";

export type RecommendationKind =
  | "review_lesson"
  | "practice_topic"
  | "retake_quiz"
  | "continue_module"
  | "focus_topic_week";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  reason: string;
  courseId: CourseId;
  /** Targets for navigation — nullable per kind. */
  lessonId?: LessonId;
  quizId?: QuizId;
  topicId?: TopicId;
  priority: number;
}

export interface RecommendationContext {
  userId: UserId;
  courseId: CourseId;
  incompleteLessonIds: LessonId[];
  latestFailedQuizIds: QuizId[];
  topicStats: LearnerTopicStats[];
  /** From student_profiles_summary or engine. */
  nextLessonId: LessonId | null;
}

/**
 * MVP rule engine — pure, explainable, no ML.
 * Order: continue → retake failed → weak topic practice → review.
 */
export function buildRecommendations(ctx: RecommendationContext): Recommendation[] {
  const out: Recommendation[] = [];
  let p = 100;

  if (ctx.nextLessonId) {
    out.push({
      id: `cont-${ctx.nextLessonId}`,
      kind: "continue_module",
      title: "המשיכו לשיעור הבא",
      reason: "יש שיעור שלא הושלם במסלול.",
      courseId: ctx.courseId,
      lessonId: ctx.nextLessonId,
      priority: p--,
    });
  }

  for (const qid of ctx.latestFailedQuizIds.slice(0, 2)) {
    out.push({
      id: `retake-${qid}`,
      kind: "retake_quiz",
      title: "חזרו על הבוחן",
      reason: "ציון מתחת לסף העובר בניסיון האחרון.",
      courseId: ctx.courseId,
      quizId: qid,
      priority: p--,
    });
  }

  const weakTopics = ctx.topicStats.filter((s) => isWeakTopic(s));
  weakTopics.sort((a, b) => a.accuracy - b.accuracy);
  for (const wt of weakTopics.slice(0, 3)) {
    out.push({
      id: `focus-${wt.topicId}`,
      kind: "focus_topic_week",
      title: "מיקוד השבוע",
      reason: `דיוק נמוך בנושא (לפי ניסיונות וסף סטטיסטי).`,
      courseId: ctx.courseId,
      topicId: wt.topicId,
      priority: p--,
    });
  }

  for (const lid of ctx.incompleteLessonIds.slice(0, 2)) {
    out.push({
      id: `review-${lid}`,
      kind: "review_lesson",
      title: "חזרה על שיעור",
      reason: "שיעור שנפתח ולא הושלם.",
      courseId: ctx.courseId,
      lessonId: lid,
      priority: p--,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}
