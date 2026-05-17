import { cn } from "@/lib/design-system/cn";
import { LessonAiBlock } from "../lesson/LessonAiBlock";

type Props = { className?: string };

/**
 * Titled wrapper around the static AI nudge (same copy as the lesson coach entry).
 */
export function LessonAiHelpBlock({ className }: Props) {
  return (
    <div className={cn("space-y-3", className)} lang="he">
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">מאמן ו-AI</h2>
      <p className="text-base leading-relaxed text-gray-600 sm:text-lg">שאלו את עוזר הקורס; התשובות מבוססות חומר (RAG).</p>
      <LessonAiBlock />
    </div>
  );
}
