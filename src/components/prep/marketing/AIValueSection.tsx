import { Container } from "@/components/ui";
import { Reveal } from "./motion/Reveal";

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

/** The assistant shown as a plain transcript: who said what, no chat bubbles. */
export function AIValueSection() {
  return (
    <section id="ai-coach" className="scroll-mt-20 bg-paper py-20 md:py-28">
      <Container max="shell">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="text-right">
            <h2 className="text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.6rem]">עוזר בתוך השיעור</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl">
              רואה את השאלה שעל המסך ועונה מתוך חומר הקורס, בעברית, עם המילים באנגלית. במבחנים מתוזמנים מסביר רק אחרי שעניתם, כדי
              שהציון ישקף את הידע שלכם. כלול בגישה המלאה.
            </p>
          </Reveal>
          <Reveal as="div">
            <ol className="space-y-5 border-s-2 border-primary ps-6" aria-label="דוגמה לשיחה עם העוזר">
              {SAMPLE.map((m, i) => (
                <li key={i} className="text-[17px] leading-relaxed">
                  <span className={m.role === "user" ? "font-bold text-ink" : "font-bold text-primary"}>
                    {m.role === "user" ? "שאלה: " : "העוזר: "}
                  </span>
                  <span className={m.role === "user" ? "text-ink" : "text-muted"}>{m.text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
