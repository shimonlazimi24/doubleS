/** Deterministic score 0–100 from counts. */
export function scorePercentFromCounts(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Map DB difficulty 1–5 to event metadata band. */
export function difficultyToBand(
  difficulty: number,
): "easy" | "medium" | "hard" | undefined {
  if (difficulty <= 0) return undefined;
  if (difficulty <= 2) return "easy";
  if (difficulty === 3) return "medium";
  return "hard";
}

/** Whether the selected option id matches a correct option (single-choice MVP). */
export function isSelectedOptionCorrect(
  selectedOptionId: string | null,
  options: { id: string; is_correct: boolean }[],
): boolean {
  if (!selectedOptionId) return false;
  const picked = options.find((o) => o.id === selectedOptionId);
  return picked?.is_correct === true;
}
