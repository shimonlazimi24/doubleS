"use client";

/**
 * The module's syllabus beside a lesson: every lesson of the current module
 * with its state, the open one marked. Stays in view while the learner works,
 * so moving to the next unit is one click and the place in the course is
 * always visible. Desktop only; phones use the drawer.
 */
import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { PREP_BASE } from "@/lib/prep/constants";
import { getModuleByLessonId } from "@/lib/amirant-course/navigation";
import { groupModuleLessons, lessonNameInModule } from "@/lib/amirant-course/lesson-content/module-lesson-groups";
import { useAmirantCourseProgressOptional } from "../AmirantCourseProgressProvider";
import { cn } from "@/lib/design-system/cn";

const BASE = `${PREP_BASE}/amirant/course`;

export function LessonSyllabusRail({ lessonId, className }: { lessonId: string; className?: string }) {
  const hit = getModuleByLessonId(lessonId);
  const progress = useAmirantCourseProgressOptional();
  if (!hit) return null;
  const { module: mod } = hit;
  const groups = groupModuleLessons(mod);
  const done = progress?.ready ? mod.lessons.filter((l) => progress.getLessonStatus(l.id) === "completed").length : 0;

  return (
    <aside className={cn("flex flex-col", className)} aria-label="שיעורי המודול" dir="rtl">
      <Link href={BASE} className="text-[13px] text-muted transition-colors hover:text-ink">
        ← כל המודולים
      </Link>
      <p className="mt-3 text-sm font-bold text-ink">{mod.title}</p>
      <p className="text-xs tabular-nums text-muted">
        {done} מתוך {mod.lessons.length}
      </p>
      <div className="mt-3 flex flex-col">
        {groups.map((g) => (
          <div key={g.key} className="pt-3 first:pt-0">
            {groups.length > 1 ? <p className="pb-1 text-[11px] font-bold tracking-[0.06em] text-muted">{g.title}</p> : null}
            {g.lessons.map((l) => {
              const active = l.id === lessonId;
              const completed = progress?.ready ? progress.getLessonStatus(l.id) === "completed" : false;
              const name = lessonNameInModule(l.title);
              return (
                <Link
                  key={l.id}
                  href={`${BASE}/lesson/${l.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-me-px grid grid-cols-[0.75rem_minmax(0,1fr)] items-center gap-2.5 border-e-2 py-1.5 pe-3 text-sm leading-snug transition-colors",
                    active ? "border-primary font-bold text-ink" : "border-transparent font-medium text-muted hover:text-ink",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "box-border h-3 w-3 rounded-full border-[1.5px]",
                      completed ? "border-primary bg-primary" : active ? "border-primary bg-paper" : "border-line bg-paper",
                    )}
                  />
                  <span className="truncate">{name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
