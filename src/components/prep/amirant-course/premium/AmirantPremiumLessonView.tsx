"use client";

import type { VocabParseResult } from "@/lib/amirant-course/vocabulary/parse-vocabulary-markdown";
import type { SidebarNextLessonProps } from "@/lib/amirant-course";
import { PremiumLessonWorkspace } from "../lesson-workspace/PremiumLessonWorkspace";
import { Text } from "@/components/ui";
import { LessonSection } from "../lesson/LessonSection";
import type { UnifiedFlowItem } from "../lesson-workspace/workspace-step";

export type { UnifiedFlowItem };

type Props = {
  lessonId: string;
  title: string;
  kindLabel: string;
  estimatedMinutes: number | null;
  intro: string;
  flow: UnifiedFlowItem[];
  mode: "markdown" | "blocks" | "vocab";
  vocabData?: VocabParseResult;
  practiceHref: string | null;
  quizHref: string | null;
  nextLessonHref: string | null;
  nextLessonTitle: string | null;
  courseHomeHref: string;
  sidebarNextLesson?: SidebarNextLessonProps | null;
};

export function AmirantPremiumLessonView({
  lessonId,
  title,
  kindLabel,
  estimatedMinutes,
  intro,
  flow,
  mode,
  vocabData,
  practiceHref,
  quizHref,
  nextLessonHref,
  nextLessonTitle,
  courseHomeHref,
  sidebarNextLesson,
}: Props) {
  const defaultIntroFallback =
    mode === "vocab"
      ? "למידת אוצר מילים — עברו בין הלשוניות: קריאה, כרטיסיות והתאמות."
      : "השיעור בנוי שלב־אחר־שלב. השתמשו במסלול הימני או בכפתורי הבא/קודם.";

  if (mode === "vocab" && !vocabData) {
    return (
      <div className="[direction:rtl] [text-align:start]">
        <LessonSection>
          <Text as="p" variant="bodySm" className="text-slate-500">
            אין מבנה אוצר מילים מזוהה לשיעור זה.
          </Text>
        </LessonSection>
      </div>
    );
  }

  return (
    <PremiumLessonWorkspace
      lessonId={lessonId}
      title={title}
      kindLabel={kindLabel}
      estimatedMinutes={estimatedMinutes}
      intro={intro}
      flow={flow}
      mode={mode}
      vocabData={vocabData}
      practiceHref={practiceHref}
      quizHref={quizHref}
      nextLessonHref={nextLessonHref}
      nextLessonTitle={nextLessonTitle}
      courseHomeHref={courseHomeHref}
      defaultIntroFallback={defaultIntroFallback}
      sidebarNextLesson={sidebarNextLesson}
    />
  );
}
