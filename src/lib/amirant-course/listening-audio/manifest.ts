/**
 * מיפוי קטעי שמיעה לשיעורי AMIRNET.
 * קבצי M4A ב־`public/amirant-listening/` (TTS לתרגול עד הקלטת אולפן).
 */

export type ListeningAudioClip = {
  id: string;
  title: string;
  /** נתיב ציבורי או URL מלא */
  src: string | null;
  examReplayLimit: number;
  suggestedFilename: string;
  /** true = קול סינתטי לתרגול, לא הקלטת מבחן */
  synthetic: boolean;
};

export const LISTENING_AUDIO_CLIPS: ListeningAudioClip[] = [
  {
    id: "listening-7.2-sample-train",
    title: "טעימה – הודעת רכבת",
    src: "/amirant-listening/7.2-sample-train.m4a",
    examReplayLimit: 1,
    suggestedFilename: "7.2-sample-train.m4a",
    synthetic: true,
  },
  {
    id: "listening-7.3-t1-p1",
    title: "מבחן 1 · קטע 1 – Academic Lecture",
    src: "/amirant-listening/7.3-t1-p1-social-media.m4a",
    examReplayLimit: 1,
    suggestedFilename: "7.3-t1-p1-social-media.m4a",
    synthetic: true,
  },
  {
    id: "listening-7.3-t1-p2",
    title: "מבחן 1 · קטע 2 – Conversation",
    src: "/amirant-listening/7.3-t1-p2-barcelona.m4a",
    examReplayLimit: 1,
    suggestedFilename: "7.3-t1-p2-barcelona.m4a",
    synthetic: true,
  },
  {
    id: "listening-7.3-t2-p1",
    title: "מבחן 2 · Climate Change Lecture",
    src: "/amirant-listening/7.3-t2-p1-climate.m4a",
    examReplayLimit: 1,
    suggestedFilename: "7.3-t2-p1-climate.m4a",
    synthetic: true,
  },
  {
    id: "listening-7.3-t3-p1",
    title: "מבחן 3 · Academic Panel",
    src: "/amirant-listening/7.3-t3-p1-panel.m4a",
    examReplayLimit: 1,
    suggestedFilename: "7.3-t3-p1-panel.m4a",
    synthetic: true,
  },
];

const byId = new Map(LISTENING_AUDIO_CLIPS.map((c) => [c.id, c]));

export function getListeningAudioClip(id: string): ListeningAudioClip | null {
  return byId.get(id.trim()) ?? null;
}

export function listeningPublicPath(filename: string): string {
  const clean = filename.replace(/^\/+/, "").replace(/^amirant-listening\//, "");
  return `/amirant-listening/${clean}`;
}
