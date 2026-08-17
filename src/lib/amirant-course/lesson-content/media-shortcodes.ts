/**
 * Shortcodes בתוך markdown של שיעור:
 * - `{{video:https://youtu.be/XXXX|כותרת}}`
 * - `{{audio:clip-id|כותרת אופציונלית}}`
 * - `{{audio:https://cdn.example/a.mp3|כותרת}}` (URL ישיר)
 */

export type MediaBodySegment =
  | { kind: "markdown"; value: string }
  | { kind: "video"; src: string; title: string }
  | { kind: "audio"; ref: string; title: string };

const MEDIA_SHORTCODE = /\{\{(video|audio):([^|}]+)(?:\|([^}]*))?\}\}/g;

export function splitBodyOnMediaShortcodes(body: string): MediaBodySegment[] {
  const segments: MediaBodySegment[] = [];
  let lastIndex = 0;
  MEDIA_SHORTCODE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MEDIA_SHORTCODE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "markdown", value: body.slice(lastIndex, match.index) });
    }
    const type = match[1] as "video" | "audio";
    const ref = match[2]!.trim();
    const title = match[3]?.trim() || (type === "video" ? "סרטון הסבר" : "קטע שמיעה");
    if (type === "video") {
      segments.push({ kind: "video", src: ref, title });
    } else {
      segments.push({ kind: "audio", ref, title });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    segments.push({ kind: "markdown", value: body.slice(lastIndex) });
  }
  return segments.length ? segments : [{ kind: "markdown", value: body }];
}

/** בלוק אטומי לפיצול שקופיות — לא לחתוך באמצע shortcode */
export function isMediaShortcodeBlock(block: string): boolean {
  return /^\s*\{\{(?:video|audio):[^}]+\}\}\s*$/.test(block.trim());
}
