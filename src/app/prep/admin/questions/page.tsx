import type { Metadata } from "next";
import Link from "next/link";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { AdminNotice, AdminPageHeader } from "@/components/prep/admin/admin-ui";
import { QUESTION_TOPIC_LABELS } from "@/lib/prep/admin/question-payload";

export const dynamic = "force-dynamic";

type Question = {
  id: string;
  topic_slug: string;
  difficulty: number;
  published: boolean;
  prompt: string;
};

async function getQuestions(): Promise<{ rows: Question[]; error: string | null }> {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) return { rows: [], error: "Supabase לא מוגדר בסביבה הזו." };
  const { data, error } = await supabase
    .from("cms_questions")
    .select("id, topic_slug, difficulty, published, prompt")
    .order("topic_slug")
    .order("difficulty")
    .limit(1000);
  if (error) return { rows: [], error: "קריאת השאלות נכשלה." };
  return { rows: (data ?? []) as Question[], error: null };
}

export const metadata: Metadata = { title: "בנק שאלות | PREPARE admin" };

export default async function QuestionsPage() {
  const { rows, error } = await getQuestions();

  return (
    <div dir="rtl" className="max-w-4xl space-y-6">
      <AdminPageHeader
        title="בנק שאלות ניסיוני"
        subtitle={`${rows.length} שאלות`}
        actions={
          <Link
            href="/prep/admin/questions/new"
            className="inline-flex min-h-11 items-center rounded-control border border-line bg-paper px-4 text-sm font-semibold text-ink transition hover:border-primary"
          >
            שאלה חדשה
          </Link>
        }
      />

      <AdminNotice tone="warning">
        הבנק הזה לא מחובר לחידונים ולסימולציות, שרצים על בנק השאלות המיובא. עריכה כאן לא משנה את מה
        שהתלמידים מתרגלים.
      </AdminNotice>

      {error ? (
        <AdminNotice tone="error">{error}</AdminNotice>
      ) : rows.length === 0 ? (
        <p className="border-y border-line py-8 text-center text-sm text-muted">אין שאלות.</p>
      ) : (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pe-4 text-start font-medium">שאלה</th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">נושא</th>
                <th scope="col" className="py-2 pe-4 text-start font-medium">קושי</th>
                <th scope="col" className="py-2 text-start font-medium">מצב</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((q) => (
                <tr key={q.id}>
                  <td className="max-w-sm py-2 pe-4">
                    <Link
                      href={`/prep/admin/questions/${encodeURIComponent(q.id)}`}
                      className="block min-h-11 truncate py-2.5 text-ink hover:text-primary"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                    >
                      {q.prompt}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap py-2 pe-4 text-muted">
                    {QUESTION_TOPIC_LABELS[q.topic_slug as keyof typeof QUESTION_TOPIC_LABELS] ?? q.topic_slug}
                  </td>
                  <td className="py-2 pe-4 tabular-nums text-muted">{q.difficulty} מתוך 6</td>
                  <td className="py-2 text-muted">{q.published ? "פורסם" : "טיוטה"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
