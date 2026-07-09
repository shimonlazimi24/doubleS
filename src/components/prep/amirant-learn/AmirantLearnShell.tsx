"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AMIRANT_DEMO_COURSE } from "@/lib/prep/amirant-demo/demo-course-content";
import { getAmirantFlatLessons } from "@/lib/prep/amirant-learn-navigation";
import { PREP_BASE } from "@/lib/prep/constants";
import { cn } from "@/lib/design-system/cn";

const LEARN_BASE = `${PREP_BASE}/amirant/learn`;

export function AmirantLearnShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const flat = getAmirantFlatLessons();
  const onOverview = pathname === LEARN_BASE || pathname === `${LEARN_BASE}/`;

  /** ברירת מחדל: פתוח; ערך `false` = סגור. */
  const [moduleExpanded, setModuleExpanded] = useState<Record<string, boolean>>({});
  const isModuleExpanded = (moduleId: string) => moduleExpanded[moduleId] !== false;

  const toggleModule = (moduleId: string) => {
    setModuleExpanded((prev) => {
      const open = prev[moduleId] !== false;
      return { ...prev, [moduleId]: !open };
    });
  };

  useEffect(() => {
    const rows = getAmirantFlatLessons();
    const activeRow = rows.find((r) => pathname === `${LEARN_BASE}/lesson/${r.lesson.id}`);
    if (activeRow) {
      setModuleExpanded((prev) => ({ ...prev, [activeRow.module.id]: true }));
    }
  }, [pathname]);

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col bg-canvas lg:flex-row">
      <aside className="shrink-0 border-b border-line/80 bg-ink text-white lg:w-[min(22rem,100%)] lg:border-b-0 lg:border-e lg:border-line/30">
        <div className="sticky top-[4.5rem] max-h-[calc(100vh-4.5rem)] overflow-y-auto px-4 py-6 lg:py-8">
          <Link
            href={`${PREP_BASE}/amirant`}
            className="text-xs font-semibold text-white/60 transition hover:text-white"
          >
            ← יציאה מהקורס
          </Link>
          <p className="mt-4 font-display text-lg font-semibold leading-snug">{AMIRANT_DEMO_COURSE.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">חוויית קורס - ניווט שיעורים, התקדמות (דמו), ומבחן מערכת.</p>

          <nav aria-label="תוכנית הקורס" className="mt-8 space-y-3">
            <div>
              <Link
                href={LEARN_BASE}
                className={cn(
                  "block rounded-md px-2 py-2 text-sm font-semibold transition",
                  onOverview ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10",
                )}
              >
                תוכנית הקורס
              </Link>
            </div>
            {(() => {
              const byModule = new Map<string, typeof flat>();
              for (const row of flat) {
                const k = row.module.id;
                if (!byModule.has(k)) byModule.set(k, []);
                byModule.get(k)!.push(row);
              }
              return sortedModulesOrder(flat).map((modId) => {
                const rows = byModule.get(modId);
                if (!rows?.length) return null;
                const modTitle = rows[0]!.module.title;
                const expanded = isModuleExpanded(modId);
                const listId = `amirant-module-${modId}-lessons`;
                return (
                  <div key={modId} className="rounded-lg border border-white/10 bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => toggleModule(modId)}
                      aria-expanded={expanded}
                      aria-controls={listId}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-start transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                    >
                      <span className="min-w-0 flex-1 text-[0.65rem] font-bold uppercase leading-snug tracking-wider text-white/85">
                        {modTitle}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "shrink-0 text-[0.65rem] text-white/45 transition-transform duration-200",
                          expanded ? "rotate-0" : "-rotate-90",
                        )}
                      >
                        ▼
                      </span>
                    </button>
                    {expanded ? (
                      <ul
                        id={listId}
                        className="space-y-0.5 border-s-2 border-primary/40 px-2 pb-2 ps-3"
                      >
                        {rows.map(({ lesson, index }) => {
                          const href = `${LEARN_BASE}/lesson/${lesson.id}`;
                          const active = pathname === href;
                          return (
                            <li key={lesson.id}>
                              <Link
                                href={href}
                                className={cn(
                                  "block rounded-md px-2 py-2 text-sm transition",
                                  active ? "bg-primary font-semibold text-white" : "text-white/90 hover:bg-white/10",
                                )}
                              >
                                <span className="text-white/50">{index + 1}. </span>
                                {lesson.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              });
            })()}
          </nav>

          <div className="mt-10 rounded-lg border border-white/15 bg-white/5 p-3 text-xs leading-relaxed text-white/75">
            <p className="font-semibold text-white/90">טיפ</p>
            <p className="mt-1">שיעור המבחן מפנה לתרגול האדפטיבי - כמו בקורסים דיגיטליים שמשלבים יחידת מבחן נפרדת.</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function sortedModulesOrder(flat: ReturnType<typeof getAmirantFlatLessons>): string[] {
  const seen: string[] = [];
  const set = new Set<string>();
  for (const row of flat) {
    if (!set.has(row.module.id)) {
      set.add(row.module.id);
      seen.push(row.module.id);
    }
  }
  return seen;
}
