import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

async function getLessons() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("cms_lessons")
    .select("id, title, kind, published, module_id, estimated_minutes, updated_at")
    .order("module_id")
    .order("sort_order");
  return data ?? [];
}

type Lesson = {
  id: string;
  title: string;
  kind: string;
  published: boolean;
  module_id: string | null;
  estimated_minutes: number;
  updated_at: string;
};

export default async function LessonsPage() {
  const lessons = await getLessons() as Lesson[];

  return (
    <div dir="rtl" className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">שיעורים</h1>
          <p className="text-zinc-400 text-sm mt-1">{lessons.length} שיעורים במערכת</p>
        </div>
        <Link
          href="/prep/admin/lessons/new"
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition"
        >
          + שיעור חדש
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-4xl mb-4">📖</div>
          <p>אין שיעורים עדיין</p>
          <Link href="/prep/admin/lessons/new" className="text-blue-400 hover:underline text-sm mt-2 inline-block">
            צור שיעור ראשון
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-right px-4 py-3 font-medium text-zinc-400">כותרת</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">מודול</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">סוג</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">סטטוס</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3 font-medium">{lesson.title}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{lesson.module_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">{lesson.kind}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.published ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                      {lesson.published ? "פורסם" : "טיוטה"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/prep/admin/lessons/${lesson.id}`} className="text-blue-400 hover:underline text-xs">
                      עריכה →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
