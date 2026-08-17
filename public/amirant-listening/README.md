# AMIRNET listening audio

Drop MP3 (or M4A) files here, then set `src` in:

`src/lib/amirant-course/listening-audio/manifest.ts`

## Expected files

| Manifest id | Suggested filename |
|-------------|--------------------|
| `listening-7.2-sample-train` | `7.2-sample-train.mp3` |
| `listening-7.3-t1-p1` | `7.3-t1-p1-social-media.mp3` |
| `listening-7.3-t1-p2` | `7.3-t1-p2-barcelona.mp3` |
| `listening-7.3-t2-p1` | `7.3-t2-p1-climate.mp3` |
| `listening-7.3-t3-p1` | `7.3-t3-p1-panel.mp3` |

## After uploading

```ts
{
  id: "listening-7.3-t1-p1",
  src: "/amirant-listening/7.3-t1-p1-social-media.mp3",
  // ...
}
```

Lesson markdown already has shortcodes:

```md
{{audio:listening-7.3-t1-p1|מבחן 1 · קטע 1}}
```

Transcripts for recording are in:

`content/amirnet-course/07_new_reform_audio_writing/7.3_listening_practice_quizzes.md`
