import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { MODULE_BLURB } from "@/lib/amirant-course/module-blurbs";
import { groupModuleLessons } from "@/lib/amirant-course/lesson-content/module-lesson-groups";
import { Reveal } from "./motion/Reveal";

function hours(min: number): string {
  if (min < 60) return `${min} דק׳`;
  const h = Math.round((min / 60) * 2) / 2;
  return `${h} שעות`;
}

/**
 * The syllabus as it is, read from the course manifest: a two-column list,
 * number, name, one line of description and the size. No table, no rules;
 * the rows appear in sequence.
 */
export function CourseSyllabusTable({ compact = false }: { compact?: boolean }) {
  const modules = AMIRANT_PREPARATION_MANIFEST.modules;
  return (
    <ol className="grid gap-x-14 gap-y-9 md:grid-cols-2">
      {modules.map((mod, i) => {
        const minutes = mod.lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0);
        const groups = groupModuleLessons(mod).filter((g) => g.key !== "guide");
        const units = groups.map((g) => `${g.lessons.length} ${g.title.replace(/^(תרגול|קטעי תרגול) /, "")}`);
        return (
          <Reveal as="li" key={mod.id} delay={(i % 2) * 80} className="flex gap-4">
            <span className="w-6 shrink-0 pt-1 text-[15px] tabular-nums text-[#9aa5b8]">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink">{mod.title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                {!compact && MODULE_BLURB[mod.id] ? `${MODULE_BLURB[mod.id]} ` : null}
                {units.length ? `${units.join(", ")}. ` : null}
                <span className="tabular-nums">
                  {mod.lessons.length} שיעורים · {hours(minutes)}
                </span>
              </p>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}
