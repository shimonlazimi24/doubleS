import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

async function getStats() {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return { lessons: 0, questions: 0, published: 0 };

  const [{ count: lessons }, { count: questions }, { count: published }] = await Promise.all([
    supabase.from("cms_lessons").select("*", { count: "exact", head: true }),
    supabase.from("cms_questions").select("*", { count: "exact", head: true }),
    supabase.from("cms_lessons").select("*", { count: "exact", head: true }).eq("published", true),
  ]);

  return { lessons: lessons ?? 0, questions: questions ?? 0, published: published ?? 0 };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "שיעורים", value: stats.lessons, sub: `${stats.published} פורסמו`, href: "/prep/admin/lessons", color: "bg-blue-500/10 border-blue-500/30" },
    { label: "שאלות", value: stats.questions, sub: "בבנק השאלות", href: "/prep/admin/questions", color: "bg-purple-500/10 border-purple-500/30" },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-400 text-sm mb-8">ניהול תכנים — שיעורים, שאלות, סרטונים</p>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={`border rounded-xl p-5 hover:bg-white/5 transition ${c.color}`}>
            <div className="text-3xl font-bold mb-1">{c.value}</div>
            <div className="text-sm font-medium">{c.label}</div>
            <div className="text-xs text-zinc-500 mt-1">{c.sub}</div>
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">פעולות מהירות</h2>
      <div className="flex gap-3 flex-wrap">
        <Link href="/prep/admin/lessons/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition">
          + שיעור חדש
        </Link>
        <Link href="/prep/admin/questions/new" className="px-4 py-2 bg-zinc-700 text-white text-sm font-medium rounded-lg hover:bg-zinc-600 transition">
          + שאלה חדשה
        </Link>
      </div>
    </div>
  );
}
