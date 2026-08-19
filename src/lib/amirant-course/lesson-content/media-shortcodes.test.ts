import { describe, expect, it } from "vitest";
import { splitBodyOnMediaShortcodes, isMediaShortcodeBlock } from "./media-shortcodes";
import { getListeningAudioClip, LISTENING_AUDIO_CLIPS } from "../listening-audio/manifest";

describe("media-shortcodes", () => {
  it("splits audio and video shortcodes from markdown", () => {
    const body = `שלום\n\n{{audio:listening-7.3-t1-p1|קטע 1}}\n\nטקסט\n\n{{video:https://youtu.be/abc|סרטון}}`;
    const segs = splitBodyOnMediaShortcodes(body);
    expect(segs.map((s) => s.kind)).toEqual(["markdown", "audio", "markdown", "video"]);
    expect(segs[1]).toMatchObject({ kind: "audio", ref: "listening-7.3-t1-p1", title: "קטע 1" });
    expect(segs[3]).toMatchObject({ kind: "video", src: "https://youtu.be/abc", title: "סרטון" });
  });

  it("treats lone shortcode as atomic block", () => {
    expect(isMediaShortcodeBlock("{{audio:listening-7.3-t1-p1|x}}")).toBe(true);
    expect(isMediaShortcodeBlock("not a shortcode")).toBe(false);
  });
});

describe("listening audio manifest", () => {
  it("registers all practice clips with suggested filenames", () => {
    expect(LISTENING_AUDIO_CLIPS.length).toBeGreaterThanOrEqual(5);
    for (const clip of LISTENING_AUDIO_CLIPS) {
      expect(clip.suggestedFilename).toMatch(/\.(mp3|m4a)$/i);
      expect(getListeningAudioClip(clip.id)?.id).toBe(clip.id);
    }
  });

  it("points practice clips at public audio files", () => {
    expect(getListeningAudioClip("listening-7.3-t1-p1")?.src).toMatch(/amirant-listening/);
  });
});
