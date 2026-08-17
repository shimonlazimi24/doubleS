/** Client helpers for /api/prep/amirant-course/grade */

export async function gradeCheckAnswer(questionId: string, selectedOptionId: string): Promise<boolean> {
  const res = await fetch("/api/prep/amirant-course/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "check", questionId, selectedOptionId }),
  });
  if (!res.ok) throw new Error("grade_check_failed");
  const data = (await res.json()) as { isCorrect?: boolean };
  return data.isCorrect === true;
}

export type GradeBatchItem = {
  questionId: string;
  isCorrect: boolean;
  correctOptionId?: string | null;
  explanation?: string | null;
};

export async function gradeBatchAnswers(
  answers: { questionId: string; selectedOptionId: string | null }[],
  reveal = false,
): Promise<{ items: GradeBatchItem[]; correct: number; total: number; scorePercent: number }> {
  const res = await fetch("/api/prep/amirant-course/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "batch", answers, reveal }),
  });
  if (!res.ok) throw new Error("grade_batch_failed");
  return (await res.json()) as {
    items: GradeBatchItem[];
    correct: number;
    total: number;
    scorePercent: number;
  };
}
