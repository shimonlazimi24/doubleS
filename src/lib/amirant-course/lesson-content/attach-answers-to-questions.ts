/**
 * Moves each answer next to the question it belongs to.
 *
 * The practice files in `content/amirnet-course` are written the way a printed
 * booklet is: every question first, then a solutions section at the end. On a
 * slide-based screen that becomes the reviewer's most repeated complaint —
 * "עד שהגעתי לתשובות שכחתי מה הייתה השאלה" — because the answer can land forty
 * cards after its question. A probe over the flagged lessons counted 29 of 50
 * cards in the listening unit carrying an explanation with no question in view.
 *
 * No splitter tuning can fix that: it cannot join what the document separated.
 * So the pairing happens before the split — each `### Qn:` answer block is
 * carried up to sit directly under its `**Qn.**` question, and the emptied
 * solutions heading is dropped.
 *
 * Question numbering restarts per test ("מבחן תרגול #2"), so pairing is scoped
 * to the top-level `#` section; an answer never crosses into another test.
 */

/** `**Q1.**`, `**Q1**`, `Q1.` — the stem marker used across the practice files. */
const QUESTION_LINE = /^\s*(?:\*\*)?Q\s*(\d+)\s*[.)]?(?:\*\*)?(?:\s|$)/;

/** `### Q1: **B** - …` — the solutions-section marker. */
const ANSWER_HEADING = /^\s*#{2,6}\s*Q\s*(\d+)\s*[:.]/;

/** Heading that opens the solutions block, e.g. `## ✅ פתרונות מבחן #1`. */
const SOLUTIONS_HEADING = /^\s*#{1,6}\s*.*(?:פתרונות|תשובות נכונות|מפתח תשובות|Answer Key)/i;

/** Top-level `#` heading — the boundary a question number may not cross. */
const TEST_SCOPE_HEADING = /^\s*#(?!#)\s+/;

const FENCE = /^\s*(?:`{3,}|~{3,})/;

type Line = string;

/**
 * A heading that merely mentions "פתרונות" may be the unit's own title
 * ("## 3 מבחנים מלאים + פתרונות מפורטים"). Only treat it as the solutions
 * section when an actual "### Qn:" answer follows it — otherwise the transform
 * would swallow the intro and everything after it.
 */
function opensSolutionsSection(lines: Line[], index: number): boolean {
  if (!SOLUTIONS_HEADING.test(lines[index] ?? "")) return false;
  for (let i = index + 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    if (ANSWER_HEADING.test(line)) return true;
    // Another heading first means this one did not open an answer key.
    if (/^\s*#{1,6}\s+/.test(line)) return false;
  }
  return false;
}

function splitScopes(lines: Line[]): Line[][] {
  const scopes: Line[][] = [];
  let current: Line[] = [];
  let inFence = false;
  for (const line of lines) {
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && TEST_SCOPE_HEADING.test(line) && current.some((l) => l.trim())) {
      scopes.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length) scopes.push(current);
  return scopes;
}

type AnswerBlock = { number: number; lines: Line[] };

/**
 * Pulls the solutions section out of one scope, returning the remaining lines
 * and the answers keyed by question number.
 */
function extractAnswers(lines: Line[]): { rest: Line[]; answers: Map<number, Line[]> } {
  const answers = new Map<number, Line[]>();
  const rest: Line[] = [];

  let inSolutions = false;
  let inFence = false;
  let current: AnswerBlock | null = null;

  const closeCurrent = () => {
    if (!current) return;
    // Trim trailing blanks so the block sits tightly under its question.
    while (current.lines.length && !current.lines[current.lines.length - 1]!.trim()) {
      current.lines.pop();
    }
    if (current.lines.length) answers.set(current.number, current.lines);
    current = null;
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    if (FENCE.test(line)) inFence = !inFence;

    if (!inFence && !inSolutions && opensSolutionsSection(lines, index)) {
      closeCurrent();
      inSolutions = true;
      continue; // the heading itself goes away with its section
    }

    if (!inSolutions) {
      rest.push(line);
      continue;
    }

    const answerStart = !inFence ? line.match(ANSWER_HEADING) : null;
    if (answerStart) {
      closeCurrent();
      current = { number: Number(answerStart[1]), lines: [] };
      // The heading line carries the answer itself ("### Q1: **B** - Beta").
      // Drop only the "### Qn:" prefix — the question above supplies the number —
      // and keep the rest, labelled so it reads as an answer and not as a new heading.
      const remainder = line.slice(answerStart[0].length).trim();
      if (remainder) current.lines.push(`**תשובה:** ${remainder}`);
      continue;
    }

    // A non-answer heading ends the solutions section (next unit begins).
    if (!inFence && /^\s*#{1,6}\s+/.test(line) && !ANSWER_HEADING.test(line)) {
      closeCurrent();
      inSolutions = false;
      rest.push(line);
      continue;
    }

    if (current) current.lines.push(line);
    // Lines inside the solutions section that belong to no answer are dropped:
    // they are the booklet's scoring instructions, not lesson content.
  }

  closeCurrent();
  return { rest, answers };
}

/** Index of the line after the question block that starts at `start`. */
function endOfQuestionBlock(lines: Line[], start: number): number {
  let i = start + 1;
  let inFence = false;
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (QUESTION_LINE.test(line)) break;
    if (/^\s*#{1,6}\s+/.test(line)) break;
  }
  // Step back over trailing blank lines so the answer sits under the options.
  let end = i;
  while (end > start + 1 && !lines[end - 1]!.trim()) end--;
  return end;
}

function insertAnswers(lines: Line[], answers: Map<number, Line[]>): Line[] {
  if (answers.size === 0) return lines;

  const out: Line[] = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i]!;
    if (FENCE.test(line)) inFence = !inFence;

    const q = !inFence ? line.match(QUESTION_LINE) : null;
    if (!q) {
      out.push(line);
      i++;
      continue;
    }

    const number = Number(q[1]);
    const end = endOfQuestionBlock(lines, i);
    for (let j = i; j < end; j++) out.push(lines[j]!);

    const answer = answers.get(number);
    if (answer) {
      out.push("");
      out.push(...answer);
      answers.delete(number);
    }

    for (let j = end; j < i + (end - i); j++) out.push(lines[j]!); // no-op guard
    i = end;
  }

  // Any answer without a matching question stays visible rather than vanishing.
  const leftovers = [...answers.entries()].sort((a, b) => a[0] - b[0]);
  if (leftovers.length) {
    out.push("");
    for (const [number, body] of leftovers) {
      out.push(`### Q${number}`);
      out.push(...body);
      out.push("");
    }
  }

  return out;
}

export function attachAnswersToQuestions(markdown: string): string {
  if (!markdown.includes("Q")) return markdown;

  const normalized = markdown.replace(/\r\n/g, "\n");
  const scopes = splitScopes(normalized.split("\n"));

  const rebuilt = scopes.map((scope) => {
    const { rest, answers } = extractAnswers(scope);
    if (answers.size === 0) return scope;
    return insertAnswers(rest, answers);
  });

  return rebuilt
    .map((s) => s.join("\n"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
