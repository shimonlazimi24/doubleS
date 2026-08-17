/**
 * מיפוי קטעי שמיעה לשיעורי AMIRNET.
 * שמים קובץ ב־`public/amirant-listening/<filename>` ומעדכנים כאן את `src`.
 * כל עוד `src` ריק / הקובץ חסר — הנגן מציג placeholder כנה.
 */

export type ListeningAudioClip = {
  id: string;
  /** כותרת לתצוגה בנגן */
  title: string;
  /** נתיב ציבורי, למשל `/amirant-listening/7.3-t1-p1.mp3` — או URL מלא */
  src: string | null;
  /**
   * כמה השמעות מותרות במצב מבחן (ברירת מחדל 1 — כמו הכנה לבחינה).
   * במצב תרגול המשתמש יכול לבחור השמעות נוספות.
   */
  examReplayLimit: number;
  /** שם קובץ מומלץ להעלאה (תיעוד) */
  suggestedFilename: string;
};

export const LISTENING_AUDIO_CLIPS: ListeningAudioClip[] = [
  {
    id: "listening-7.2-sample-train",
    title: "טעימה – הודעת רכבת",
    src: null,
    examReplayLimit: 1,
    suggestedFilename: "7.2-sample-train.mp3",
  },
  {
    id: "listening-7.3-t1-p1",
    title: "מבחן 1 · קטע 1 – Academic Lecture",
    src: null,
    examReplayLimit: 1,
    suggestedFilename: "7.3-t1-p1-social-media.mp3",
  },
  {
    id: "listening-7.3-t1-p2",
    title: "מבחן 1 · קטע 2 – Conversation",
    src: null,
    examReplayLimit: 1,
    suggestedFilename: "7.3-t1-p2-barcelona.mp3",
  },
  {
    id: "listening-7.3-t2-p1",
    title: "מבחן 2 · Climate Change Lecture",
    src: null,
    examReplayLimit: 1,
    suggestedFilename: "7.3-t2-p1-climate.mp3",
  },
  {
    id: "listening-7.3-t3-p1",
    title: "מבחן 3 · Academic Panel",
    src: null,
    examReplayLimit: 1,
    suggestedFilename: "7.3-t3-p1-panel.mp3",
  },
];

const byId = new Map(LISTENING_AUDIO_CLIPS.map((c) => [c.id, c]));

export function getListeningAudioClip(id: string): ListeningAudioClip | null {
  return byId.get(id.trim()) ?? null;
}

/** נתיב מלא לקובץ אם הועלה לפי suggestedFilename */
export function listeningPublicPath(filename: string): string {
  const clean = filename.replace(/^\/+/, "").replace(/^amirant-listening\//, "");
  return `/amirant-listening/${clean}`;
}
