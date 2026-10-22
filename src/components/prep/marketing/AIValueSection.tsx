import { MarketingSection } from "@/components/prep/marketing/MarketingSection";

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

/** What the assistant does, in concrete terms; no sample conversation, no promises about intelligence. */
export function AIValueSection() {
  return (
    <MarketingSection id="ai-coach" eyebrow="למנויים" title="עוזר בתוך השיעור" subtitle="שאלה על המשפט, על המילה או על השיטה, בלי לצאת מהשיעור." tone="canvas">
      <ul className="max-w-3xl border-t border-line">
        {ROWS.map((r) => (
          <li key={r.title} className="border-b border-line/70 py-4">
            <p className="text-[15px] font-bold text-ink">{r.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{r.body}</p>
          </li>
        ))}
      </ul>
    </MarketingSection>
  );
}
