import Link from "next/link";
import type { DemoLesson, DemoModule } from "@/lib/prep/amirant-demo/demo-course-content";
import { PREP_BASE } from "@/lib/prep/constants";
import { cn } from "@/lib/design-system/cn";

const LEARN = `${PREP_BASE}/amirant/learn`;

function sortedModules(modules: DemoModule[]): DemoModule[] {
  return [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
}

function sortedLessons(lessons: DemoLesson[]): DemoLesson[] {
  return [...lessons].sort((a, b) => a.sortOrder - b.sortOrder);
}

function moduleLabel(title: string, fallbackIndex: number): { index: number; name: string } {
  const m = /^(\d+)\.\s*(.+)$/.exec(title.trim());
  if (m) return { index: parseInt(m[1]!, 10), name: m[2]!.trim() };
  return { index: fallbackIndex + 1, name: title };
}

function ChevronStart() {
  return (
    <svg
      className="size-4 shrink-0 text-primary/35 transition group-hover:text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function AmirantLearnCurriculum({ modules }: { modules: DemoModule[] }) {
  const list = sortedModules(modules);
  const totalLessons = list.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <section className="mt-14 border-t border-line/70 pt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary/90">מסלול הלמידה</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">תוכנית הלימודים</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            מודולים מסודרים לפי נושאים. בכל שיעור — מדריכים, תרגול או מבחן, לפי הסוג. לחצו על שורה כדי להיכנס לשיעור.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full border border-line/80 bg-paper px-3 py-1.5 font-medium text-ink shadow-sm">
            {list.length} מודולים
          </span>
          <span className="rounded-full border border-line/80 bg-paper px-3 py-1.5 font-medium text-ink shadow-sm">
            {totalLessons} שיעורים
          </span>
        </div>
      </div>

      <div className="mt-10 space-y-5">
        {list.map((mod, modIdx) => {
          const lessons = sortedLessons(mod.lessons);
          const { index: modNum, name: modName } = moduleLabel(mod.title, modIdx);
          return (
            <article
              key={mod.id}
              className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.12)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/60 bg-gradient-to-l from-primary/[0.06] to-transparent px-5 py-4 md:px-6 md:py-5">
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm"
                    aria-hidden
                  >
                    {modNum}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-base font-semibold leading-snug text-ink md:text-lg">{modName}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {lessons.length} {lessons.length === 1 ? "שיעור" : "שיעורים"}
                    </p>
                  </div>
                </div>
              </div>

              <ol className="divide-y divide-line/50">
                {lessons.map((lesson, i) => (
                  <li key={lesson.id}>
                    <Link
                      href={`${LEARN}/lesson/${lesson.id}`}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3.5 transition md:px-6 md:py-4",
                        "hover:bg-primary/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary/40",
                      )}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-low text-xs font-semibold tabular-nums text-muted group-hover:bg-primary/10 group-hover:text-primary"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-start">
                        <span className="block text-sm font-medium leading-snug text-ink group-hover:text-primary">
                          {lesson.title}
                        </span>
                      </span>
                      {lesson.estimatedMinutes != null ? (
                        <span className="hidden shrink-0 text-xs tabular-nums text-muted sm:inline">
                          ~{lesson.estimatedMinutes} דק׳
                        </span>
                      ) : null}
                      <ChevronStart />
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
    </section>
  );
}
