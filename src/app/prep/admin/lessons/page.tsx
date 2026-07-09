import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";

async function getCmsLessonIds(): Promise<Set<string>> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return new Set();
  const { data } = await supabase
    .from("cms_lessons")
    .select("id, published");
  if (!data) return new Set();
  // Return map id → published
  return new Set(data.filter((l) => l.published).map((l) => l.id));
}

async function getCmsLessonsMap(): Promise<Map<string, { published: boolean }>> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return new Map();
  const { data } = await supabase
    .from("cms_lessons")
    .select("id, published");
  const map = new Map<string, { published: boolean }>();
  for (const row of data ?? []) map.set(row.id, { published: row.published });
  return map;
}

const MODULE_ICON: Record<string, string> = {
  "mod-intro":     "🗺️",
  "mod-vocab":     "📚",
  "mod-sc":        "✏️",
  "mod-rephrase":  "🔄",
  "mod-reading":   "📖",
  "mod-reform":    "🎧",
  "mod-sims":      "🎯",
  "mod-tips":      "💡",
  "mod-summary":   "🏁",
  "mod-logistics": "📋",
};

export default async function LessonsPage() {
  const cmsMap = await getCmsLessonsMap();
  const manifest = AMIRANT_PREPARATION_MANIFEST;
  const totalLessons = manifest.modules.reduce((s, m) => s + m.lessons.length, 0);
  const editedCount = manifest.modules
    .flatMap((m) => m.lessons)
    .filter((l) => cmsMap.has(l.id)).length;

  return (
    <div dir="rtl" className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">עריכת הקורס</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {totalLessons} שיעורים ·{" "}
            <span className="text-blue-400">{editedCount} עם תוכן מותאם</span>
          </p>
        </div>
        <Link
          href="/prep/admin/lessons/new"
          className="px-4 py-2 bg-zinc-700 text-white text-sm rounded-lg hover:bg-zinc-600 transition"
        >
          + שיעור חדש
        </Link>
      </div>

      {/* Course tree */}
      <div className="space-y-4">
        {manifest.modules.map((mod) => {
          const editedInMod = mod.lessons.filter((l) => cmsMap.has(l.id)).length;
          return (
            <div key={mod.id} className="border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900">
                <span className="text-lg">{MODULE_ICON[mod.id] ?? "📌"}</span>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-100">{mod.title}</p>
                  <p className="text-[11px] text-zinc-500">{mod.lessons.length} שיעורים</p>
                </div>
                {editedInMod > 0 && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    {editedInMod} נערכו
                  </span>
                )}
              </div>

              {/* Lessons */}
              <div className="divide-y divide-zinc-800/60">
                {mod.lessons.map((lesson) => {
                  const cms = cmsMap.get(lesson.id);
                  const href = cms
                    ? `/prep/admin/lessons/${lesson.id}`
                    : `/prep/admin/lessons/new?id=${lesson.id}&title=${encodeURIComponent(lesson.title)}&module=${mod.id}`;

                  return (
                    <Link
                      key={lesson.id}
                      href={href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition group"
                    >
                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        cms
                          ? cms.published ? "bg-green-400" : "bg-yellow-400"
                          : "bg-zinc-700"
                      }`} />

                      {/* Title + ID */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 group-hover:text-white transition truncate">
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono">{lesson.id}</p>
                      </div>

                      {/* Badge */}
                      <span className={`text-[10px] shrink-0 px-2 py-0.5 rounded-full ${
                        cms
                          ? cms.published
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                          : "text-zinc-600 group-hover:text-zinc-400"
                      }`}>
                        {cms ? (cms.published ? "פורסם" : "טיוטה") : "ערוך"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> פורסם - מוצג לתלמידים</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> טיוטה - רק אתה רואה</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-700" /> ברירת מחדל</span>
      </div>
    </div>
  );
}
