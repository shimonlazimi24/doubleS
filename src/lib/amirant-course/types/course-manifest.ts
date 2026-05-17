export type LessonKind = "video" | "text" | "mixed";

export interface ManifestLesson {
  id: string;
  title: string;
  kind: LessonKind;
  estimatedMinutes: number;
  /** Optional video path when hosted (Supabase storage / CDN). */
  videoPath?: string | null;
  /** Practice: fixed set of question ids from bank (subset). */
  practiceSetId?: string;
  /** Adaptive or fixed quiz id from manifest. */
  quizId?: string;
}

export interface ManifestPracticeSet {
  id: string;
  title: string;
  questionIds: string[];
}

export interface ManifestQuiz {
  id: string;
  title: string;
  /** Adaptive MCQ test — engine picks 16 from bank. */
  adaptive: boolean;
  questionCount: number;
  timeLimitSec: number | null;
  /** Filter bank by these topic slugs; empty = all topics. */
  topicSlugs: string[];
  /**
   * In-test working level (מסלול האדפטציה) לא יורד מתחת לערך, אחרי תשובות שגויות.
   * למשל: מבחן דוגמה "רמה 3+".
   */
  minInTestLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ManifestModule {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  lessons: ManifestLesson[];
  practiceSets: ManifestPracticeSet[];
  quizzes: ManifestQuiz[];
}

export interface ManifestSimulation {
  id: string;
  title: string;
  /** Pilot section (not scored). */
  pilot: { seconds: number; questionCount: number; topicSlug: string };
  /** Scored sections — timers must sum to 39 minutes. */
  sections: { label: string; seconds: number; topicSlug: string; questionCount: number }[];
}

export interface CourseManifest {
  id: string;
  slug: string;
  title: string;
  description: string;
  modules: ManifestModule[];
  simulations: ManifestSimulation[];
}
