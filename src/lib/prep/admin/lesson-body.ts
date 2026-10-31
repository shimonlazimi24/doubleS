/**
 * The editor opens pre-filled with the text from the course files. Saving that
 * text unchanged used to copy it into `cms_lessons`, which froze the lesson: a
 * later fix to the course files never reached learners, because a non-empty CMS
 * body always wins. Unchanged text is saved as empty, which means "use the files".
 */
export function bodyToSave(edited: string, staticMarkdown: string): string {
  if (!staticMarkdown.trim()) return edited;
  return edited.trim() === staticMarkdown.trim() ? "" : edited;
}
