import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";

function metaParts(meta: string): { questions: string; minutes: string } {
  const [questions = "", minutes = ""] = meta.split("·").map((x) => x.trim());
  return { questions, minutes };
}

/** מפרט המבחן כטבלת עובדות שטוחה - לא שלושה כרטיסים זהים. */
export function ExamStructureTable() {
  return (
    <div className="max-w-3xl">
      <ul>
        {EXAM_STRUCTURE.parts.map((part) => {
          const { questions, minutes } = metaParts(part.meta);
          return (
            <li
              key={part.title}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-t border-line/70 py-4 first:border-t-0 sm:grid-cols-[11rem_1fr_auto]"
            >
              <h3 className="text-base font-semibold text-ink">{part.title}</h3>
              <p className="col-span-2 text-sm leading-relaxed text-muted sm:col-span-1 sm:col-start-2">
                {part.body}
              </p>
              <p className="row-start-1 text-sm tabular-nums text-primary sm:col-start-3" dir="rtl">
                <span className="font-semibold">{questions}</span>
                <span className="text-muted"> · {minutes}</span>
              </p>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line/70 pt-3 text-xs text-muted">
        הפרקים חוזרים לאורך המבחן ברמת קושי מסתגלת - בקורס מתרגלים כל סוג בנפרד ואז יחד בסימולציה.
      </p>
    </div>
  );
}
