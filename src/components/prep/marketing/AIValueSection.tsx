import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { SectionPanel } from "./SectionPanel";

const ROWS = [
  {
    title: "הסבר על השאלה שעל המסך",
    body: "העוזר רואה את השאלה והאפשרויות שהלומד עובד עליהן עכשיו, ומסביר למה התשובה נכונה ולמה המסיחים לא, בעברית, עם המילים באנגלית.",
  },
  {
    title: "תשובות מתוך חומר הקורס",
    body: "ההסברים נשענים על המדריכים והשיעורים של הקורס, לא על ידע כללי. כשמשהו לא נמצא בקורס, העוזר אומר זאת.",
  },
  {
    title: "לא מגלה תשובות למבחנים מתוזמנים",
    body: "במבחני התרגול ובסימולציות העוזר מסביר רק אחרי שעניתם, כדי שהציון ישקף את הידע שלכם.",
  },
] as const;

/** A real exchange from the course: the learner's question and the assistant's answer. */
const SAMPLE = [
  { role: "user", text: "למה התשובה היא made ולא did?" },
  {
    role: "assistant",
    text: "כי באנגלית אומרים make a mistake, לא do a mistake. זה צירוף קבוע (collocation). הרמז במשפט הוא המילה mistake שבאה מיד אחרי החסר, ולכן הצורה הנכונה בעבר היא made.",
  },
  { role: "user", text: "ויש עוד צירופים כאלה שכדאי לזכור?" },
  {
    role: "assistant",
    text: "כן, במדריך השיטות (שיטה 5: קולוקציות) יש רשימה. הנפוצים במבחן: make a decision, take a break, do homework, have an effect.",
  },
] as const;

export function AIValueSection() {
  return (
    <MarketingSection id="ai-coach" eyebrow="למנויים" title="עוזר בתוך השיעור" subtitle="שאלה על המשפט, על המילה או על השיטה, בלי לצאת מהשיעור." tone="low">
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <SectionPanel className="p-5 md:p-6">
          <p className="mb-4 border-b border-line/70 pb-3 text-sm font-semibold text-muted">עוזר הקורס · מבחן תרגול 1, שאלה 2</p>
          <ol className="space-y-3">
            {SAMPLE.map((m, i) => (
              <li
                key={i}
                className={
                  m.role === "user"
                    ? "ms-10 rounded bg-primary/10 px-4 py-2.5 text-[15px] leading-relaxed text-ink"
                    : "me-10 rounded border border-line/70 bg-paper px-4 py-2.5 text-[15px] leading-relaxed text-ink"
                }
              >
                {m.text}
              </li>
            ))}
          </ol>
        </SectionPanel>
        <ul className="divide-y divide-line/70">
          {ROWS.map((r) => (
            <li key={r.title} className="py-5 first:pt-0">
              <p className="text-lg font-bold text-ink">{r.title}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </MarketingSection>
  );
}
