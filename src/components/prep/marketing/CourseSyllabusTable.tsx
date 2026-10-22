import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { MODULE_BLURB } from "@/lib/amirant-course/module-blurbs";
import { groupModuleLessons } from "@/lib/amirant-course/lesson-content/module-lesson-groups";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";
import { SectionPanel } from "./SectionPanel";

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
  const totals = [
    { value: COURSE_FACTS.modules, label: "מודולים" },
    { value: COURSE_FACTS.lessons, label: "שיעורים" },
    { value: `כ־${COURSE_FACTS.hours}`, label: "שעות לימוד" },
  ];
  return (
    <SectionPanel className="max-w-5xl">
      <div className="grid grid-cols-3 border-b border-line bg-surface-low">
        {totals.map((t) => (
          <div key={t.label} className="px-5 py-4 text-right">
            <p className="text-2xl font-extrabold tabular-nums tracking-tight text-primary">{t.value}</p>
            <p className="text-sm text-muted">{t.label}</p>
          </div>
        ))}
      </div>
      <table className="w-full border-collapse">
        <thead className="hidden sm:table-header-group">
          <tr className="text-xs font-bold text-muted">
            <th className="w-12 px-5 py-3 text-start">#</th>
            <th className="py-3 text-start">מודול</th>
            <th className="w-28 py-3 text-start">שיעורים</th>
            <th className="w-28 px-5 py-3 text-end">זמן</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((mod, i) => {
            const minutes = mod.lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0);
            const groups = groupModuleLessons(mod).filter((g) => g.key !== "guide");
            const units = groups.map((g) => `${g.lessons.length} ${g.title.replace(/^(תרגול|קטעי תרגול) /, "")}`);
            return (
              <tr key={mod.id} className="border-t border-line/70 odd:bg-paper even:bg-canvas">
                <td className="px-5 py-4 align-top text-sm tabular-nums text-muted">{i + 1}</td>
                <td className="py-4 align-top">
                  <p className="text-[15px] font-bold text-ink">{mod.title}</p>
                  {!compact ? <p className="mt-0.5 text-sm leading-relaxed text-muted">{MODULE_BLURB[mod.id]}</p> : null}
                  {units.length ? <p className="mt-0.5 text-[13px] text-muted">{units.join(" · ")}</p> : null}
                  <p className="mt-1 text-[13px] tabular-nums text-muted sm:hidden">
                    {mod.lessons.length} שיעורים · {hours(minutes)}
                  </p>
                </td>
                <td className="hidden py-4 align-top text-sm tabular-nums text-muted sm:table-cell">{mod.lessons.length}</td>
                <td className="hidden px-5 py-4 align-top text-end text-sm tabular-nums text-muted sm:table-cell">{hours(minutes)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SectionPanel>
  );
}
