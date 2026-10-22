import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { SectionPanel } from "./SectionPanel";

function metaParts(meta: string): { questions: string; minutes: string } {
  const [questions = "", minutes = ""] = meta.split("·").map((x) => x.trim());
  return { questions, minutes };
}

/** The three question types side by side: the figures first, then what the type asks. */
export function ExamStructureTable() {
  return (
    <div>
      <ul className="grid gap-6 md:grid-cols-3">
        {EXAM_STRUCTURE.parts.map((part) => {
          const { questions, minutes } = metaParts(part.meta);
          return (
            <li key={part.title}>
              <SectionPanel className="h-full p-6 text-right">
                <h3 className="text-lg font-bold text-ink">{part.title}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-4 border-y border-line/70 py-4">
                  <div>
                    <dd className="text-2xl font-extrabold tabular-nums tracking-tight text-primary">{questions.replace(/\D+$/, "")}</dd>
                    <dt className="text-sm text-muted">שאלות בפרק</dt>
                  </div>
                  <div>
                    <dd className="text-2xl font-extrabold tabular-nums tracking-tight text-primary">{minutes.replace(/\D+/g, "")}</dd>
                    <dt className="text-sm text-muted">דקות לפרק</dt>
                  </div>
                </dl>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{part.body}</p>
              </SectionPanel>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
        הפרקים חוזרים לאורך המבחן ברמת קושי מסתגלת. בקורס מתרגלים כל סוג בנפרד ואז יחד בסימולציה.
      </p>
    </div>
  );
}
