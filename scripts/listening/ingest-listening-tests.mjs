/**
 * Puts the content owner's listening tests into the bank.
 *
 * Reads content/amirant-import/owner/listening-tests.json and
 * listening-clips.json (from parse-listening-docs.mjs) and writes:
 *
 *   - 70 questions (topic `listening`, tag owner_ls + owner-ls-test-N,
 *     shuffle-safe, difficulty = the clip's level) into questions.json
 *   - 42 passages, one per clip: the audio player and the context sentence as
 *     the body, and the transcript plus the test's hard words as
 *     `revealMarkdown`, which the inline card shows only after checking
 *   - src/lib/amirant-course/listening-audio/owner-clips.ts: the player
 *     manifest for the clips (a clip whose .m4a is missing gets src null, so
 *     the player says the audio is not available instead of failing)
 *
 * Earlier owner_ls entries are replaced. Prints the lesson titles the
 * manifest should carry (level label from the same scale the other owner
 * units use), so `amirnet-content-sync.ts` can be checked against it.
 *
 * Usage: node scripts/listening/ingest-listening-tests.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const TESTS = path.join(root, "content/amirant-import/owner/listening-tests.json");
const CLIPS = path.join(root, "content/amirant-import/owner/listening-clips.json");
const BANK = path.join(root, "content/amirant-import/source/questions.json");
const PASSAGES = path.join(root, "content/amirant-import/source/passages.json");
const AUDIO_DIR = path.join(root, "public/prep/listening");
const AUDIO_MANIFEST = path.join(AUDIO_DIR, "manifest.json");
const OUT_TS = path.join(root, "src/lib/amirant-course/listening-audio/owner-clips.ts");
const TAG = "owner_ls";
const OPTION_IDS = ["a", "b", "c", "d"];
const LENGTH_HE = { "קצר": "קצר", "בינוני": "בינוני", "ארוך": "ארוך" };

const tests = JSON.parse(fs.readFileSync(TESTS, "utf8"));
const clips = new Map(JSON.parse(fs.readFileSync(CLIPS, "utf8")).map((c) => [c.id, c]));
const durations = fs.existsSync(AUDIO_MANIFEST) ? JSON.parse(fs.readFileSync(AUDIO_MANIFEST, "utf8")) : {};

export const audioClipId = (clipId) => `ls-${clipId}`;
export const passageId = (clipId) => `owner-ls-${clipId.toLowerCase()}`;
export const lessonId = (n) => `lesson.listening.test-${String(n).padStart(2, "0")}`;

/** Same scale as owner-sets.test.ts, over the clip levels of the test's questions. */
export function levelLabel(levels) {
  const mean = levels.reduce((s, l) => s + l, 0) / levels.length;
  const scale = [[2.5, "קל"], [3.5, "קל-בינוני"], [4.25, "בינוני"], [5, "בינוני-קשה"], [5.75, "קשה"], [6.2, "קשה מאוד"]];
  return scale.find(([lim]) => mean < lim)?.[1] ?? "הקשה ביותר";
}

function subtopic(stem) {
  const s = stem.toLowerCase();
  if (/mainly|main (point|idea|topic|purpose|argument)|what is the (lecture|talk|conversation) about/.test(s)) return "listening-main-idea";
  if (/suggest|imply|infer|attitude|position|probably|most likely|agree|opinion|by the end/.test(s)) return "listening-inference";
  return "listening-detail";
}

const escapeMd = (s) => s.replace(/([*_`])/g, "\\$1");

function transcriptMarkdown(clip, vocab) {
  const body = clip.transcript.map((line) => {
    const d = line.match(/^([AB]):\s*(.+)$/);
    return d ? `**${d[1]}:** ${escapeMd(d[2])}` : escapeMd(line);
  });
  const text = clip.transcript.join(" ").toLowerCase();
  const words = vocab.filter((v) => text.includes(v.word.toLowerCase()));
  const parts = ["**תמליל הקטע**", ...body];
  if (words.length) {
    parts.push("**מילים מהקטע**", ...words.map((v) => `${v.word} [${v.pronunciation}] — ${v.he}. _${v.en}_`));
  }
  return parts.join("\n\n");
}

const items = [];
const passages = [];
const titles = [];
for (const t of tests) {
  const n = t.test;
  for (const c of t.clips) {
    const brief = clips.get(c.clipId);
    const seconds = durations[c.clipId]?.seconds ?? c.seconds;
    passages.push({
      passageId: passageId(c.clipId),
      title: `קטע שמע ${c.index} · ${LENGTH_HE[c.length] ?? c.length} · כ-${Math.round(seconds)} שניות`,
      bodyMarkdown: `{{audio:${audioClipId(c.clipId)}|קטע שמע ${c.index}}}\n\n${escapeMd(c.context)}`,
      revealMarkdown: transcriptMarkdown(c, t.vocab),
      sourceTag: TAG,
      level: brief.level,
    });
  }
  const levels = [];
  for (const q of t.questions) {
    const clip = t.clips.find((c) => c.index === q.clipIndex);
    const level = clips.get(clip.clipId).level;
    levels.push(level);
    items.push({
      questionId: `ls-t${String(n).padStart(2, "0")}-q${q.number}`,
      topic: "listening",
      subtopic: subtopic(q.stem),
      difficultyLevel: level,
      questionText: q.stem,
      options: q.options.map((label, i) => ({ id: OPTION_IDS[i], label })),
      correctOptionId: OPTION_IDS[q.correctIndex],
      explanation: `**הסבר קצר:** ${q.explanationHe}\n\n_${q.explanationEn}_`,
      distractorExplanations: {},
      estimatedTimeSec: 84,
      passageId: passageId(clip.clipId),
      tags: [TAG, "shuffle-safe", `owner-ls-test-${n}`, "quiz", `difficulty_${level}`],
    });
  }
  titles.push({ id: lessonId(n), title: `מבחן האזנה ${n} (${levelLabel(levels)})` });
}

const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
const kept = bank.filter((q) => !(q.tags ?? []).includes(TAG));
const foreign = kept.filter((q) => items.some((i) => i.questionId === q.questionId));
if (foreign.length) {
  console.error(foreign.map((q) => `${q.questionId} is already used by a non-listening question`).join("\n"));
  process.exit(1);
}
fs.writeFileSync(BANK, `${JSON.stringify([...kept, ...items], null, 2)}\n`);
const allP = JSON.parse(fs.readFileSync(PASSAGES, "utf8"));
const keptP = allP.filter((p) => p.sourceTag !== TAG);
fs.writeFileSync(PASSAGES, `${JSON.stringify([...keptP, ...passages.map(({ level, ...p }) => p)], null, 2)}\n`);

const manifest = [...clips.values()].sort((a, b) => a.id.localeCompare(b.id)).map((c) => {
  const file = `${c.id}.m4a`;
  const has = fs.existsSync(path.join(AUDIO_DIR, file));
  return {
    id: audioClipId(c.id),
    title: `קטע שמע · כ-${Math.round(durations[c.id]?.seconds ?? c.seconds)} שניות`,
    src: has ? `/prep/listening/${file}` : null,
    examReplayLimit: 3,
    suggestedFilename: file,
    synthetic: true,
    durationSec: durations[c.id]?.seconds ?? null,
  };
});
const ts = `/**
 * The content owner's listening clips (14 tests × 3). Generated by
 * scripts/listening/ingest-listening-tests.mjs — do not edit by hand.
 * A clip whose .m4a is not under public/prep/listening/ has src null.
 */
import type { ListeningAudioClip } from "./manifest";

export const OWNER_LISTENING_CLIPS: (ListeningAudioClip & { durationSec: number | null })[] = ${JSON.stringify(manifest, null, 2)};
`;
fs.writeFileSync(OUT_TS, ts);

console.log(`Merged: questions.json ${bank.length} → ${kept.length + items.length}, passages.json ${allP.length} → ${keptP.length + passages.length}; ${manifest.filter((m) => m.src).length}/${manifest.length} clips have audio.`);
console.log("Lesson titles:");
for (const t of titles) console.log(`  { id: "${t.id}", title: "${t.title}", kind: "text", estimatedMinutes: 9 },`);
console.log("Next: npm run generate:course-manifest");
