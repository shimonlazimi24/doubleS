import type { AmirantQuestionType } from "./schemas";

const TYPE_LABEL_HE: Record<AmirantQuestionType, string> = {
  sentence_completion: "השלמת משפט / השללה בחלל",
  rephrasing: "ניסוח מחדש / Restatement",
  reading_comprehension: "הבנת הנקרא",
  vocabulary: "אוצר מילים",
  simulation: "סימולציית אמירנט / תרחיש",
  general_lesson: "שאלה כללית מהשיעור",
};

export function labelQuestionTypeHe(t: AmirantQuestionType | "unknown" | null | undefined): string {
  if (!t || t === "unknown") return "שאלה כללית";
  return TYPE_LABEL_HE[t] ?? t;
}

export function stagedHintModePrompt(params: {
  questionType: AmirantQuestionType | "unknown";
  stage: 1 | 2 | 3 | 4;
  allowFullAnswer: boolean;
}): string {
  const tl = labelQuestionTypeHe(params.questionType);
  const s = params.stage;
  const stageLine =
    s === 1
      ? "- Stage 1: Name the type briefly, then ONE small strategy (how to start / what to notice)."
      : s === 2
        ? "- Stage 2: Point to a clue, keyword, or structural feature in the text/options - not the solution end."
        : s === 3
          ? "- Stage 3: Name 1–2 *wrong* options with a short reason each (grammar clash, not in passage, etc.) - do NOT name the correct option or letter."
          : "- Stage 4: The student is allowed a full solution path - explain reasoning; ground in context. If the key is not in the chunks, do not fabricate it.";

  return [
    "Staged help - you are a learning assistant, not an answer key.",
    `Inferred or provided question type: **${tl}** (internal label; use Hebrew in the answer).`,
    `Current hint STAGE: **${s}** (strict).`,
    "",
    "Rules (must follow):",
    "- Stages 1–3: NEVER give the final/letter answer or a single line that only states the key.",
    stageLine,
    params.allowFullAnswer || s >= 4
      ? "- If at stage 4 or explicit reveal: you may state the best answer and why, only when supported by the material."
      : "- Stages 1–3: do not reveal the final answer even if the student asks; say they can use \"גלה תשובה\" when allowed.",
    "",
    "Type-specific nudges (at most one short line, use what matches):",
    "- sentence_completion: context clues, grammar fit, collocation.",
    "- rephrasing: meaning preserved, certainty, time, added/omitted information.",
    "- reading_comprehension: main idea, evidence, paragraph role.",
    "- vocabulary: context, register, common confusions (no invention beyond context).",
    "- simulation: pacing and strategy only - no invented scores or official rules.",
  ].join("\n");
}
