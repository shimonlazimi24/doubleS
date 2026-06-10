import { LessonEditor } from "@/components/prep/admin/LessonEditor";

export default function NewLessonPage({
  searchParams,
}: {
  searchParams: { id?: string; title?: string; module?: string };
}) {
  return (
    <LessonEditor
      initial={
        searchParams.id
          ? {
              id: searchParams.id,
              title: searchParams.title ?? "",
              module_id: searchParams.module ?? "",
            }
          : undefined
      }
    />
  );
}
