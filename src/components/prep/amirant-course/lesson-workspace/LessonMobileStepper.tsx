import { cn } from "@/lib/design-system/cn";
import type { BuiltWorkspaceStep } from "./workspace-step";

type Props = {
  steps: BuiltWorkspaceStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
};

/**
 * Top horizontal step strip on small screens.
 */
export function LessonMobileStepper({ steps, activeIndex, onSelect, className }: Props) {
  return (
    <div className={cn("lg:hidden", className)} dir="rtl">
      <div
        className="no-scrollbar -mx-0.5 flex gap-1 overflow-x-auto pb-1.5 [direction:rtl] [text-align:start] [-webkit-overflow-scrolling:touch]"
        role="tablist"
        aria-label="מעבר מהיר בין שלבים"
      >
        {steps.map((s, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              title={s.label}
              aria-selected={active}
              onClick={() => onSelect(i)}
                className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl border text-start font-medium leading-snug transition-all duration-200 ease-out motion-reduce:duration-0",
                active
                  ? "min-w-[12rem] max-w-[22rem] items-start border-slate-800 bg-slate-800 py-2.5 ps-3 pe-2.5 text-sm text-white shadow-sm [text-wrap:balance] sm:min-w-[16rem] sm:text-base"
                  : "h-9 min-h-9 min-w-9 items-center justify-center border-gray-200/90 bg-white px-1.5 text-sm text-gray-600 shadow-sm",
              )}
            >
              <span
                className={cn("tabular-nums", active ? "shrink-0 text-white/90" : "text-gray-500")}
                aria-hidden
              >
                {i + 1}
              </span>
              {active ? (
                <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere]">{s.label}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
