import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";

async function getCmsLessons() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("cms_lessons")
    .select("id, title, kind, published, module_id, estimated_minutes, updated_at")
    .order("module_id")
    .order("sort_order");
  return data ?? [];
}

type CmsLesson = {
  id: string;
  title: string;
  kind: string;
  published: boolean;
  module_id: string | null;
  estimated_minutes: number;
  updated_at: string;
};

const MODULE_TITLES: Record<string, string> = {
  "mod-intro": "מבוא לקורס",
  "mod-vocab": "מילון מושגים",
  "mod-sc": "השלמת משפטים",
  "mod-rephrase": "ניסוח מחדש",
  "mod-reading": "קטעי קריאה",
  "mod-reform": "רפורמה 2026",
  "mod-sims": "סימולציות מלאות",
  "mod-tips": "טיפים ואסטרטגיות",
  "mod-summary": "סיכום הקורס",
};

export default async function LessonsPage() {
  const cmsLessons = await getCmsLessons() as CmsLesson[];
  const cmsIds = new Set(cmsLessons.map((l) => l.id));

  // All manifest lessons — show which ones have a CMS override
  const manifestLessons = AMIRANT_PREPARATION_MANIFEST.modules.flatMap((mod) =>
    mod.lessons.map((l) => ({ ...l, moduleId: mod.id, moduleTitle: mod.title }))
  );

  return (
    <div dir="rtl" className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">שיעורים</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {manifestLessons.length} שיעורים בקורס · {cmsLessons.length} עם תוכן מותאם אישית
          </p>
        </div>
        <Link
          href="/prep/admin/lessons/new"
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition"
        >
          + שיעור חדש
        </Link>
      </div>

      {/* CMS-only lessons (not in manifest) */}
      {cmsLessons.filter((l) => !manifestLessons.find((m) => m.id === l.id)).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">שיעורים חדשים (לא בקורס הרשמי עדיין)</h2>
          <div className="border border-amber-900/40 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="text-right px-4 py-3 font-medium text-zinc-400">כותרת</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-400">מודול</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-400">סטטוס</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cmsLessons
                  .filter((l) => !manifestLessons.find((m) => m.id === l.id))
                  .map((lesson) => (
                    <tr key={lesson.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                      <td className="px-4 py-3 font-medium">{lesson.title}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{MODULE_TITLES[lesson.module_id ?? ""] ?? lesson.module_id ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.published ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                          {lesson.published ? "פורסם" : "טיוטה"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Link href={`/prep/admin/lessons/${lesson.id}`} className="text-blue-400 hover:underline text-xs">
                          עריכה →
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All manifest lessons */}
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">שיעורי הקורס</h2>
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="text-right px-4 py-3 font-medium text-zinc-400">שיעור</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">מודול</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">תוכן</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {manifestLessons.map((lesson) => {
              const hasOverride = cmsIds.has(lesson.id);
              const cmsLesson = cmsLessons.find((l) => l.id === lesson.id);
              return (
                <tr key={lesson.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-100">{lesson.title}</p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{lesson.id}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{lesson.moduleTitle}</td>
                  <td className="px-4 py-3">
                    {hasOverride ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                        {cmsLesson?.published ? "✏️ CMS פורסם" : "✏️ CMS טיוטה"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                        קובץ ברירת מחדל
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left">
                    <Link
                      href={hasOverride ? `/prep/admin/lessons/${lesson.id}` : `/prep/admin/lessons/new?id=${lesson.id}&title=${encodeURIComponent(lesson.title)}&module=${lesson.moduleId}`}
                      className="text-blue-400 hover:underline text-xs"
                    >
                      {hasOverride ? "עריכה →" : "ערוך תוכן →"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
