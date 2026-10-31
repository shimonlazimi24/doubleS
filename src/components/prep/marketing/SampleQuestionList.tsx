import type { SampleQuestion } from "@/lib/prep/marketing/sample-questions";

const LETTERS = ["A", "B", "C", "D"] as const;

/**
 * The sample questions as a numbered list separated by hairlines. The stem
 * and options are English and run LTR inside the RTL page; the answer sits
 * behind a native disclosure, so it works with no script and the text is in
 * the HTML for the Quiz schema.
 */
export function SampleQuestionList({ questions }: { questions: readonly SampleQuestion[] }) {
  return (
    <ol className="mt-10 border-t border-line" role="list">
      {questions.map((q, i) => (
        <li key={q.id} className="border-b border-line py-8">
          <p className="text-sm text-muted">
            <span className="font-semibold tabular-nums text-ink">שאלה {i + 1}</span>
            <span aria-hidden> · </span>
            {q.sectionHe}
            <span aria-hidden> · </span>
            {q.scored ? "קובע את הציון" : "פרק ניסוי: יכול רק להוסיף"}
          </p>

          {q.context ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-muted">{q.contextLabelHe}</p>
              <p dir="ltr" lang="en" className="mt-1 max-w-[40rem] text-start text-[16px] leading-[1.8] text-ink">
                {q.context}
              </p>
            </div>
          ) : null}

          <p dir="ltr" lang="en" className="mt-4 max-w-[40rem] text-start text-[1.1rem] font-semibold leading-relaxed text-ink">
            {q.stem}
          </p>
          <ol dir="ltr" lang="en" className="mt-3 max-w-[40rem] space-y-1.5 text-start text-[16px] leading-relaxed text-ink" role="list">
            {q.options.map((opt, j) => (
              <li key={opt} className="flex gap-3">
                <span className="w-5 shrink-0 font-semibold tabular-nums text-muted">{LETTERS[j]}</span>
                <span>{opt}</span>
              </li>
            ))}
          </ol>

          <details className="group mt-4 max-w-[40rem]">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[15px] font-semibold text-primary [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">הצגת התשובה וההסבר</span>
              <span className="hidden group-open:inline">הסתרת התשובה</span>
            </summary>
            <p className="mt-2 text-[16px] leading-relaxed text-ink">
              <strong className="font-bold">התשובה: </strong>
              <span dir="ltr" className="[unicode-bidi:isolate]">
                ({LETTERS[q.correct]}) {q.options[q.correct]}
              </span>
            </p>
            <p className="mt-2 text-[16px] leading-relaxed text-muted">{q.explanationHe}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}
