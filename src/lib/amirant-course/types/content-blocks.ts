/**
 * Structured lesson body - no raw HTML stored in DB or CMS for this course.
 * Rendered in the UI via `AmirantPremiumLessonView` (flow) and `LessonBlockRenderer` (raw blocks).
 */
export type ContentBlock =
  | { type: "intro"; title: string; body: string }
  | { type: "explanation"; title: string; body: string }
  | { type: "examples"; title: string; items: string[] }
  | { type: "summary"; title: string; bullets: string[] }
  | { type: "callout"; variant: "tip" | "warning" | "info"; body: string };

export interface LessonContent {
  lessonId: string;
  /**
   * מסלול יחסי תחת `content/amirnet-course/` (למשל `01_welcome_and_intro/unit_1_complete_welcome_and_intro.md`).
   * כשהוא מוגדר, עמוד השיעור מציג את מלוא ה־Markdown מהריפו - לא תמצית ב־registry.
   */
  amirnetMarkdownRel?: string;
  /**
   * מקטע בתוך אותו קובץ - אחרי `splitMarkdownByMasachH1` (מסמך 1.1, 1.2, …).
   */
  amirnetMarkdownSectionIndex?: number;
  blocks: ContentBlock[];
}
