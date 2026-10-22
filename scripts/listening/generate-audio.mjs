/**
 * Records the 42 listening clips with OpenAI text-to-speech.
 *
 * For each brief in content/amirant-import/owner/listening-clips.json:
 *   - a monologue is one request (voice by the lecturer's sex), split at
 *     [pause] into segments joined with 0.8 s of silence;
 *   - a dialogue renders each line with its speaker's voice (A/B keep a fixed
 *     voice per clip, chosen from the "Speakers:" line), 0.6 s between lines.
 * The voice direction from the brief goes in the model's `instructions`.
 * Segments come back as 24 kHz mono PCM, are joined in Node, written as WAV,
 * then encoded to AAC .m4a by scripts/listening/encode-aac.swift.
 *
 * Output: public/prep/listening/<clip_id>.m4a and manifest.json with the real
 * durations. Existing files are skipped unless --force. Then re-run
 * scripts/listening/ingest-listening-tests.mjs so the manifest picks them up.
 *
 * Needs OPENAI_API_KEY in the environment (or .env.local). Never printed.
 *
 * Usage: node scripts/listening/generate-audio.mjs [--only LL-L3-0002] [--force] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import "../load-project-env.mjs";

const root = process.cwd();
const CLIPS = path.join(root, "content/amirant-import/owner/listening-clips.json");
const OUT_DIR = path.join(root, "public/prep/listening");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const SWIFT = path.join(root, "scripts/listening/encode-aac.swift");
const MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const RATE = 24000;
const LINE_GAP_SEC = 0.6;
const PAUSE_SEC = 0.8;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const DRY = args.includes("--dry-run");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const key = process.env.OPENAI_API_KEY?.trim();
if (!key && !DRY) {
  console.error("OPENAI_API_KEY is not set (put it in .env.local or the environment).");
  process.exit(2);
}

/** Fixed voices: students young, professors older, by the sex the brief names. */
function voiceFor(role) {
  const r = role.toLowerCase();
  const female = /female|woman|she\b/.test(r);
  const senior = /professor|lecturer|instructor|advisor|librarian|doctor|tutor|teacher/.test(r);
  if (female) return senior ? "shimmer" : "nova";
  return senior ? "onyx" : "echo";
}

/** "A: female student | B: male geology professor" → { A: "nova", B: "onyx" }. */
function voicesFor(brief) {
  const map = {};
  if (brief.speakers.includes("|")) {
    for (const part of brief.speakers.split("|")) {
      const m = part.trim().match(/^([AB]):\s*(.+)$/);
      if (m) map[m[1]] = voiceFor(m[2]);
    }
  } else {
    map.solo = voiceFor(brief.speakers);
  }
  return map;
}

async function tts(text, voice, instructions) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice, input: text, instructions, response_format: "pcm" }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

const silence = (sec) => Buffer.alloc(Math.round(sec * RATE) * 2);

function wav(pcm) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** The spoken segments of a clip: [{ voice, text }] with explicit gaps between them. */
function segments(brief) {
  const voices = voicesFor(brief);
  const out = [];
  for (const line of brief.script) {
    const voice = line.speaker ? voices[line.speaker] : voices.solo;
    if (!voice) throw new Error(`${brief.id}: no voice for speaker ${line.speaker}`);
    const parts = line.text.split(/\s*\[pause\]\s*/).filter(Boolean);
    parts.forEach((text, i) => {
      if (i > 0) out.push({ gap: PAUSE_SEC });
      out.push({ voice, text });
    });
    out.push({ gap: LINE_GAP_SEC });
  }
  out.pop();
  return out;
}

async function render(brief) {
  const segs = segments(brief);
  const chars = segs.reduce((s, x) => s + (x.text?.length ?? 0), 0);
  if (DRY) return { chars, seconds: null };
  const buffers = [];
  for (const s of segs) {
    if (s.gap) { buffers.push(silence(s.gap)); continue; }
    buffers.push(await tts(s.text, s.voice, brief.voice));
  }
  const pcm = Buffer.concat([silence(0.3), ...buffers, silence(0.5)]);
  const wavPath = path.join(OUT_DIR, `${brief.id}.wav`);
  const m4aPath = path.join(OUT_DIR, `${brief.id}.m4a`);
  fs.writeFileSync(wavPath, wav(pcm));
  const seconds = Number(execFileSync("swift", [SWIFT, wavPath, m4aPath, "48000"], { encoding: "utf8" }).trim());
  fs.unlinkSync(wavPath);
  return { chars, seconds, bytes: fs.statSync(m4aPath).size };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const briefs = JSON.parse(fs.readFileSync(CLIPS, "utf8")).filter((b) => !only || b.id === only);
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  let chars = 0;
  for (const b of briefs) {
    const target = path.join(OUT_DIR, `${b.id}.m4a`);
    if (!FORCE && !DRY && fs.existsSync(target) && manifest[b.id]) { console.log(`  keep ${b.id}`); continue; }
    const r = await render(b);
    chars += r.chars;
    if (r.seconds != null) {
      manifest[b.id] = { seconds: r.seconds, bytes: r.bytes, model: MODEL };
      fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`  ${b.id}: ${r.seconds}s, ${(r.bytes / 1024).toFixed(0)}KB (brief said ~${b.seconds}s)`);
    } else {
      console.log(`  ${b.id}: ${r.chars} characters`);
    }
  }
  // gpt-4o-mini-tts is billed per input token (~$0.60/M) plus audio output
  // (~$12/M audio tokens, roughly $0.015 per minute of speech).
  const minutes = briefs.reduce((s, b) => s + b.seconds, 0) / 60;
  console.log(`${briefs.length} clips, ${chars} characters, ~${minutes.toFixed(1)} min of speech ≈ $${(minutes * 0.015 + (chars / 4 / 1e6) * 0.6).toFixed(2)}`);
  if (!DRY) console.log("Next: node scripts/listening/ingest-listening-tests.mjs (registers the files and real durations)");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
