import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { Reveal } from "./motion/Reveal";
import { CountUp } from "./motion/CountUp";

function metaParts(meta: string): { questions: number; minutes: number } {
  const [q = "", m = ""] = meta.split("·");
  return { questions: Number(q.replace(/\D+/g, "")), minutes: Number(m.replace(/\D+/g, "")) };
}

/** The three question types as three columns of type on the navy band: name, two big figures, one line. */
export function ExamStructureTable() {
  return (
    <div>
      <ul className="grid gap-12 md:grid-cols-3 md:gap-16">
        {EXAM_STRUCTURE.parts.map((part, i) => {
          const { questions, minutes } = metaParts(part.meta);
          return (
            <Reveal as="li" key={part.title} delay={i * 110} className="text-right">
              <h3 className="text-[1.4rem] font-extrabold">{part.title}</h3>
              <div className="mt-5 flex gap-8">
                <div>
                  <p className="text-5xl font-black leading-none tabular-nums">
                    <CountUp value={questions} />
                  </p>
                  <p className="mt-1.5 text-sm text-white/70">שאלות בפרק</p>
                </div>
                <div>
                  <p className="text-5xl font-black leading-none tabular-nums">
                    <CountUp value={minutes} />
                  </p>
                  <p className="mt-1.5 text-sm text-white/70">דקות לפרק</p>
                </div>
              </div>
              <p className="mt-5 text-[16px] leading-relaxed text-white/85">{part.body}</p>
            </Reveal>
          );
        })}
      </ul>
      <Reveal delay={300}>
        <p className="mt-12 max-w-3xl text-[15px] leading-relaxed text-white/65">
          בפרק הניסיוני: הבנת הנשמע (3 קטעים, 5 שאלות, 7 דקות) ומטלת כתיבה (90–120 מילים, 12 דקות). שניהם בקורס. הפרקים חוזרים לאורך
          המבחן ברמת קושי מסתגלת.
        </p>
      </Reveal>
    </div>
  );
}
