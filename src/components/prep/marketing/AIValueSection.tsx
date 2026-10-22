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

/** The assistant shown as the conversation it is; the messages arrive one after another. */
export function AIValueSection() {
  return (
    <section id="ai-coach" className="scroll-mt-20 bg-paper py-20 md:py-28">
      <Container max="shell">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal from="start" className="text-right">
            <p className="mb-2 text-sm font-semibold text-primary">למנויים</p>
            <h2 className="text-[2.1rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.6rem]">עוזר בתוך השיעור</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted md:text-xl">
              רואה את השאלה שעל המסך ועונה מתוך חומר הקורס, בעברית, עם המילים באנגלית. במבחנים מתוזמנים מסביר רק אחרי שעניתם, כדי
              שהציון ישקף את הידע שלכם.
            </p>
          </Reveal>
          <ol className="flex flex-col gap-3.5" aria-label="דוגמה לשיחה עם העוזר">
            {SAMPLE.map((m, i) => (
              <Reveal
                as="li"
                key={i}
                from={m.role === "user" ? "start" : "end"}
                delay={i * 260}
                className={
                  m.role === "user"
                    ? "max-w-[80%] self-start rounded-md bg-surface-low px-4 py-3 text-[16px] leading-relaxed text-ink"
                    : "max-w-[88%] self-end rounded-md border border-line bg-paper px-4 py-3 text-[16px] leading-relaxed text-ink"
                }
              >
                {m.text}
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
