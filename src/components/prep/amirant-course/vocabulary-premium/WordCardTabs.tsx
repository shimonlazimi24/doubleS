"use client";

import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/design-system/cn";

export type WordCardTabId = "meaning" | "examples" | "extra";

const TABS: { id: WordCardTabId; label: string }[] = [
  { id: "meaning", label: "משמעות" },
  { id: "examples", label: "דוגמאות" },
  { id: "extra", label: "נוסף" },
];

export type WordCardTabsProps = {
  panels: Record<WordCardTabId, ReactNode>;
  showExamples?: boolean;
  showExtra?: boolean;
  className?: string;
};

/**
 * Segmented control: Meaning / Examples / Extra (progressive disclosure).
 */
export function WordCardTabs({ panels, showExamples = true, showExtra = true, className }: WordCardTabsProps) {
  const baseId = useId();
  const [tab, setTab] = useState<WordCardTabId>("meaning");

  const visible = TABS.filter((t) => {
    if (t.id === "examples" && !showExamples) return false;
    if (t.id === "extra" && !showExtra) return false;
    return true;
  });

  const visibleIds = useMemo(() => visible.map((t) => t.id), [visible]);
  const effective = visibleIds.includes(tab) ? tab : visibleIds[0] ?? "meaning";

  const panel = (
    <div
      className="min-h-[5rem] [text-align:start]"
      id={`${baseId}-panel-${effective}`}
      role="tabpanel"
      aria-labelledby={visible.length > 1 ? `${baseId}-tab-${effective}` : undefined}
    >
      {panels[effective]}
    </div>
  );

  if (visible.length <= 1) {
    return <div className={cn(className)}>{panel}</div>;
  }

  return (
    <div className={cn("space-y-3 [direction:rtl]", className)} lang="he">
      <div
        role="tablist"
        aria-label="פרטי מילה"
        className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-slate-200/90 bg-stone-50/60 p-1"
      >
        {visible.map((t) => {
          const sel = effective === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={sel}
              tabIndex={sel ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cn(
                "min-h-9 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4",
                sel ? "bg-white text-[#0f2347] shadow-sm ring-1 ring-slate-200/80" : "text-slate-600 hover:bg-white/90",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {panel}
    </div>
  );
}
