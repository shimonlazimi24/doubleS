import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { MODULE_BLURB } from "@/lib/amirant-course/module-blurbs";
import { groupModuleLessons } from "@/lib/amirant-course/lesson-content/module-lesson-groups";

function hours(min: number): string {
  if (min < 60) return `${min} דק׳`;
  const h = Math.round((min / 60) * 2) / 2;
  return `${h} שעות`;
}

/**
 * The syllabus as it is: every module, what it holds and how long it takes,
 * read from the course manifest. The same list a learner sees after signing in.
 */
export function CourseSyllabusTable({ compact = false }: { compact?: boolean }) {
  const modules = AMIRANT_PREPARATION_MANIFEST.modules;
  return (
    <ol className="border-t border-line">
      {modules.map((mod, i) => {
        const minutes = mod.lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0);
        const groups = groupModuleLessons(mod).filter((g) => g.key !== "guide");
        const units = groups.map((g) => `${g.lessons.length} ${g.title.replace(/^(תרגול|קטעי תרגול) /, "")}`);
        return (
          <li
            key={mod.id}
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 border-b border-line/70 py-4 sm:grid-cols-[2rem_minmax(0,1fr)_9rem_6rem]"
          >
            <span className="text-sm tabular-nums text-muted">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-ink">{mod.title}</p>
              {!compact ? <p className="mt-0.5 text-sm leading-relaxed text-muted">{MODULE_BLURB[mod.id]}</p> : null}
              {units.length ? <p className="mt-0.5 text-[13px] text-muted">{units.join(" · ")}</p> : null}
            </div>
            <span className="col-start-2 text-[13px] tabular-nums text-muted sm:col-start-3">{mod.lessons.length} שיעורים</span>
            <span className="col-start-2 text-[13px] tabular-nums text-muted sm:col-start-4 sm:text-end">{hours(minutes)}</span>
          </li>
        );
      })}
    </ol>
  );
}
