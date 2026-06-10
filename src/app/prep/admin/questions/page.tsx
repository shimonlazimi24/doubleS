import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

type Question = {
  id: string;
  topic_slug: string;
  difficulty: number;
  published: boolean;
  prompt: string;
};

async function getQuestions(): Promise<Question[]> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("cms_questions")
    .select("id, topic_slug, difficulty, published, prompt")
    .order("topic_slug")
    .order("difficulty");
  return (data ?? []) as Question[];
}

const TOPIC_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  sentence_completion: "Sentence Completion",
  rephrasing: "Restatement",
  reading_comprehension: "Reading",
};

export default async function QuestionsPage() {
  const questions = await getQuestions();

  return (
    <div dir="rtl" className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">בנק שאלות</h1>
          <p className="text-zinc-400 text-sm mt-1">{questions.length} שאלות</p>
        </div>
        <Link href="/prep/admin/questions/new" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition">
          + שאלה חדשה
        </Link>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <div className="text-4xl mb-4">❓</div>
          <p>אין שאלות עדיין</p>
          <Link href="/prep/admin/questions/new" className="text-blue-400 hover:underline text-sm mt-2 inline-block">
            צור שאלה ראשונה
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-right px-4 py-3 font-medium text-zinc-400">שאלה</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">נושא</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">קושי</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">סטטוס</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-xs text-zinc-300" dir="ltr">{q.prompt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded">{TOPIC_LABELS[q.topic_slug] ?? q.topic_slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${q.difficulty <= 2 ? "bg-green-900/40 text-green-400" : q.difficulty <= 4 ? "bg-yellow-900/40 text-yellow-400" : "bg-red-900/40 text-red-400"}`}>
                      {q.difficulty}/6
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.published ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                      {q.published ? "פורסם" : "טיוטה"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/prep/admin/questions/${q.id}`} className="text-blue-400 hover:underline text-xs">עריכה</Link>
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
