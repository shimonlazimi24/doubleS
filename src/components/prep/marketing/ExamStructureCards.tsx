import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { cn } from "@/lib/design-system/cn";

export function ExamStructureCards() {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {EXAM_STRUCTURE.parts.map((part, i) => (
        <li
          key={part.title}
          className={cn(
            "flex flex-col rounded-surface border border-line/80 bg-paper p-6 shadow-card",
            i === 2 && "md:col-span-1",
          )}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{part.meta}</span>
          <h3 className="mt-2 text-lg font-semibold text-ink">{part.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{part.body}</p>
        </li>
      ))}
    </ul>
  );
}
