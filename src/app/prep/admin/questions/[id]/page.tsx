import { notFound } from "next/navigation";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { QuestionForm } from "@/components/prep/admin/QuestionForm";

export default async function EditQuestionPage({ params }: { params: { id: string } }) {
  const supabase = createPrepSupabaseServerClient();
  if (!supabase) notFound();

  const { data: q } = await supabase
    .from("cms_questions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!q) notFound();

  return (
    <QuestionForm
      initial={{
        id: q.id,
        topic_slug: q.topic_slug,
        subtopic_slug: q.subtopic_slug ?? "",
        prompt: q.prompt,
        options: q.options,
        correct_option_id: q.correct_option_id,
        explanation: q.explanation ?? "",
        difficulty: q.difficulty,
        published: q.published,
      }}
    />
  );
}
