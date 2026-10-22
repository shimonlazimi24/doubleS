/**
 * Turns the content owner's two listening documents into the owner JSON the
 * course reads:
 *
 *   content/amirant-import/owner/listening-tests.json  – 14 tests, each with
 *     3 clips (context sentence, clip id, transcript, speakers) and 5 questions
 *     (options, correct option, short explanation he + en), plus the test's
 *     hard-word list.
 *   content/amirant-import/owner/listening-clips.json  – the 42 recording
 *     briefs: level, estimated seconds, word count, speakers, voice direction,
 *     the script as spoken lines (speaker label + text, [pause] kept).
 *
 * Input is the plain text of the .docx files (one paragraph per line); see the
 * usage line. Every check that fails aborts the run: nothing is written.
 *
 * Usage:
 *   node scripts/listening/parse-listening-docs.mjs <tests.txt> <recording.txt>
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_TESTS = path.join(root, "content/amirant-import/owner/listening-tests.json");
const OUT_CLIPS = path.join(root, "content/amirant-import/owner/listening-clips.json");

const [testsFile, recFile] = process.argv.slice(2);
if (!testsFile || !recFile) {
  console.error("Usage: node scripts/listening/parse-listening-docs.mjs <tests.txt> <recording.txt>");
  process.exit(2);
}

const CLIP_ID = /^(LL-L(\d)-\d{4})/;
const errors = [];

function lines(file) {
  return fs.readFileSync(file, "utf8").split("\n").map((l) => l.replace(/ /g, " ").replace(/\s+$/, ""));
}

// ---------------------------------------------------------------- recording package

function parseRecording(ls) {
  const clips = new Map();
  let cur = null;
  const flush = () => {
    if (!cur) return;
    while (cur.script.length && !cur.script[cur.script.length - 1].trim()) cur.script.pop();
    clips.set(cur.id, cur);
    cur = null;
  };
  for (const raw of ls) {
    const l = raw.trim();
    const m = l.match(/^(LL-L(\d)-\d{4}) · כ-(\d+) שניות · (\d+) מילים$/);
    if (m) {
      flush();
      cur = { id: m[1], level: Number(m[2]), seconds: Number(m[3]), words: Number(m[4]), speakers: "", voice: "", script: [] };
      continue;
    }
    if (/^מבחן \d+$/.test(l)) { flush(); continue; }
    if (!cur) continue;
    if (l.startsWith("Speakers:")) { cur.speakers = l.slice("Speakers:".length).trim(); continue; }
    if (l.startsWith("Voice:")) { cur.voice = l.slice("Voice:".length).trim(); continue; }
    if (!l && !cur.script.length) continue;
    cur.script.push(l);
  }
  flush();
  // Script lines → spoken segments. A dialogue line is "A: text"; a monologue
  // paragraph has no label. Blank lines inside a script are paragraph breaks.
  for (const c of clips.values()) {
    const segs = [];
    for (const l of c.script) {
      if (!l) continue;
      const d = l.match(/^([AB]):\s*(.+)$/);
      segs.push(d ? { speaker: d[1], text: d[2].trim() } : { speaker: null, text: l });
    }
    c.script = segs;
    if (!c.speakers) errors.push(`${c.id}: no Speakers line`);
    if (!c.voice) errors.push(`${c.id}: no Voice line`);
    if (!segs.length) errors.push(`${c.id}: empty script`);
    const dialogue = /\|/.test(c.speakers);
    if (dialogue && segs.some((s) => !s.speaker)) errors.push(`${c.id}: dialogue with an unlabelled line`);
    if (!dialogue && segs.some((s) => s.speaker)) errors.push(`${c.id}: monologue with a speaker label`);
    const spoken = segs.map((s) => s.text).join(" ").replace(/\[pause\]/g, "").split(/\s+/).filter(Boolean).length;
    if (Math.abs(spoken - c.words) > Math.max(8, c.words * 0.08)) errors.push(`${c.id}: ${spoken} words spoken, brief says ${c.words}`);
  }
  return clips;
}

// ---------------------------------------------------------------- tests document

function parseTests(ls) {
  // Split into "מבחן N" sections: questions part, answer key, full solutions.
  const tests = new Map();
  let i = 0;
  const at = () => ls[i] ?? "";
  const isTestStart = (l) => /^מבחן \d+$/.test(l.trim());
  const isKeyStart = (l) => /^מבחן \d+ – מפתח תשובות$/.test(l.trim());
  const isSolStart = (l) => /^מבחן \d+ – פתרונות מלאים$/.test(l.trim());
  const isBoundary = (l) => isTestStart(l) || isKeyStart(l) || isSolStart(l);

  while (i < ls.length) {
    const l = at().trim();
    if (isTestStart(l)) {
      const n = Number(l.match(/\d+/)[0]);
      const t = { test: n, clips: [], questions: [], key: new Map(), vocab: [] };
      tests.set(n, t);
      i++;
      let clip = null;
      let q = null;
      while (i < ls.length && !isBoundary(at())) {
        const s = at().trim();
        let m;
        if ((m = s.match(/^קטע שמע (\d) · (קצר|בינוני|ארוך) · כ-(\d+) שניות$/))) {
          clip = { index: Number(m[1]), length: m[2], seconds: Number(m[3]), context: "", clipId: "", questionNumbers: [] };
          t.clips.push(clip);
          q = null;
          i++;
          // context sentence: the next non-empty line that is not the file line
          while (i < ls.length && !at().trim()) i++;
          clip.context = at().trim();
          i++;
          continue;
        }
        if ((m = s.match(/^🎧 קובץ שמע: (LL-L\d-\d{4})\.(m4a|mp3)$/))) {
          if (!clip) errors.push(`test ${n}: audio file line outside a clip`);
          else clip.clipId = m[1];
          i++;
          continue;
        }
        if ((m = s.match(/^(\d)\.\s+(.+)$/)) && clip) {
          q = { number: Number(m[1]), stem: m[2].trim(), options: [], clipIndex: clip.index };
          t.questions.push(q);
          clip.questionNumbers.push(q.number);
          i++;
          continue;
        }
        if ((m = s.match(/^\((\d)\)\s+(.+)$/)) && q) {
          if (Number(m[1]) !== q.options.length + 1) errors.push(`test ${n} q${q.number}: option numbering jumps`);
          q.options.push(m[2].trim());
          i++;
          continue;
        }
        i++;
      }
      continue;
    }
    if (isKeyStart(l)) {
      const n = Number(l.match(/\d+/)[0]);
      const t = tests.get(n);
      i++;
      while (i < ls.length && !isBoundary(at())) {
        const s = at().trim();
        if (/^\d$/.test(s)) {
          const qn = Number(s);
          let j = i + 1;
          while (j < ls.length && !ls[j].trim()) j++;
          const m = (ls[j] ?? "").trim().match(/^\((\d)\)\s+(.+)$/);
          if (!m) errors.push(`test ${n}: answer key for q${qn} has no "(k) text" line`);
          else t.key.set(qn, { pos: Number(m[1]), text: m[2].trim() });
          i = j + 1;
          continue;
        }
        i++;
      }
      continue;
    }
    if (isSolStart(l)) {
      const n = Number(l.match(/\d+/)[0]);
      const t = tests.get(n);
      i++;
      let section = null; // "vocab" | "transcript" | "question"
      let clip = null;
      let q = null;
      let pendingVocab = null;
      while (i < ls.length && !isBoundary(at())) {
        const s = at().trim();
        let m;
        if (s === "מילים קשות מהקטע") { section = "vocab"; i++; continue; }
        if ((m = s.match(/^קטע שמע (\d)$/))) {
          clip = t.clips.find((c) => c.index === Number(m[1]));
          if (!clip) errors.push(`test ${n}: solutions mention clip ${m[1]} which the test does not have`);
          section = "clip";
          i++;
          continue;
        }
        if (s === "תמליל הקטע") { section = "transcript"; clip.transcript = []; i++; continue; }
        if ((m = s.match(/^דוברים:\s*(.+)$/)) && section === "transcript") { clip.speakers = m[1].trim(); i++; continue; }
        if ((m = s.match(/^שאלה (\d)$/))) {
          q = t.questions.find((x) => x.number === Number(m[1]));
          if (!q) errors.push(`test ${n}: solutions mention q${m[1]} which the test does not have`);
          section = "question";
          i++;
          // stem + options repeated; skip to "הסבר קצר"
          continue;
        }
        if (s === "הסבר קצר" && q) {
          let j = i + 1;
          const take = () => { while (j < ls.length && !ls[j].trim()) j++; return (ls[j++] ?? "").trim(); };
          q.explainHe = take();
          q.explainEn = take();
          const fin = take();
          const fm = fin.match(/^✓ תשובה סופית:\s*(.+)$/);
          if (!fm) errors.push(`test ${n} q${q.number}: no "✓ תשובה סופית" after the short explanation`);
          else q.final = fm[1].trim();
          i = j;
          continue;
        }
        if (section === "vocab" && s) {
          if ((m = s.match(/^(\S+)\s+\[([^\]]+)\]\s+—\s+(.+)$/))) {
            pendingVocab = { word: m[1], pronunciation: m[2], he: m[3].trim(), en: "" };
            t.vocab.push(pendingVocab);
          } else if (pendingVocab && !pendingVocab.en) {
            pendingVocab.en = s;
          } else {
            errors.push(`test ${n}: unexpected vocab line "${s.slice(0, 40)}"`);
          }
          i++;
          continue;
        }
        if (section === "transcript" && clip) {
          if (s) clip.transcript.push(s);
          i++;
          continue;
        }
        i++;
      }
      continue;
    }
    i++;
  }
  return tests;
}

// ---------------------------------------------------------------- checks + output

const clips = parseRecording(lines(recFile));
const tests = parseTests(lines(testsFile));

if (clips.size !== 42) errors.push(`recording package: ${clips.size} clips (want 42)`);
if (tests.size !== 14) errors.push(`tests document: ${tests.size} tests (want 14)`);

const usedClips = new Set();
for (const t of [...tests.values()].sort((a, b) => a.test - b.test)) {
  const at = `test ${t.test}`;
  if (t.clips.length !== 3) errors.push(`${at}: ${t.clips.length} clips (want 3)`);
  if (t.questions.length !== 5) errors.push(`${at}: ${t.questions.length} questions (want 5)`);
  for (const c of t.clips) {
    if (!c.clipId) { errors.push(`${at} clip ${c.index}: no clip id`); continue; }
    if (!clips.has(c.clipId)) errors.push(`${at} clip ${c.index}: ${c.clipId} is not in the recording package`);
    if (usedClips.has(c.clipId)) errors.push(`${at} clip ${c.index}: ${c.clipId} is used twice`);
    usedClips.add(c.clipId);
    if (!c.context) errors.push(`${at} clip ${c.index}: no context sentence`);
    if (!c.transcript?.length) errors.push(`${at} clip ${c.index}: no transcript in the solutions`);
    if (!c.questionNumbers.length) errors.push(`${at} clip ${c.index}: no questions`);
    const brief = clips.get(c.clipId);
    if (brief && c.transcript?.length) {
      const a = c.transcript.join(" ").replace(/^[AB]:\s*/gm, "").replace(/\s+/g, " ");
      const b = brief.script.map((s) => s.text).join(" ").replace(/\[pause\]\s*/g, "").replace(/\s+/g, " ");
      const norm = (x) => x.replace(/[AB]:\s*/g, "").replace(/[^\w]/g, "").toLowerCase();
      if (norm(a) !== norm(b)) errors.push(`${at} clip ${c.index}: transcript differs from the recording script (${c.clipId})`);
    }
  }
  for (const q of t.questions) {
    const qa = `${at} q${q.number}`;
    if (q.options.length !== 4) errors.push(`${qa}: ${q.options.length} options`);
    const k = t.key.get(q.number);
    if (!k) { errors.push(`${qa}: no answer key`); continue; }
    if (q.options[k.pos - 1] !== k.text) errors.push(`${qa}: answer key "(${k.pos}) ${k.text}" does not match option ${k.pos} "${q.options[k.pos - 1]}"`);
    if (!q.explainHe || !q.explainEn) errors.push(`${qa}: short explanation missing`);
    if (q.final !== k.text) errors.push(`${qa}: "✓ תשובה סופית" differs from the answer key`);
    if (/\(\s*[1-4]\s*\)|אפשרות [1-4]|תשובה [1-4]/.test(`${q.explainHe} ${q.explainEn}`)) errors.push(`${qa}: explanation refers to an option by number`);
    q.correctIndex = k.pos - 1;
  }
}
if (usedClips.size !== clips.size) errors.push(`${clips.size - usedClips.size} recording briefs are not used by any test`);

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} — nothing written:\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const testsOut = [...tests.values()].sort((a, b) => a.test - b.test).map((t) => ({
  test: t.test,
  clips: t.clips.map((c) => ({
    index: c.index,
    clipId: c.clipId,
    length: c.length,
    seconds: c.seconds,
    level: clips.get(c.clipId).level,
    context: c.context,
    speakers: c.speakers ?? clips.get(c.clipId).speakers,
    transcript: c.transcript,
    questionNumbers: c.questionNumbers,
  })),
  questions: t.questions.map((q) => ({
    number: q.number,
    clipIndex: q.clipIndex,
    stem: q.stem,
    options: q.options,
    correctIndex: q.correctIndex,
    explanationHe: q.explainHe,
    explanationEn: q.explainEn,
  })),
  vocab: t.vocab,
}));
const clipsOut = [...clips.values()].sort((a, b) => a.id.localeCompare(b.id)).map((c) => ({
  id: c.id, level: c.level, seconds: c.seconds, words: c.words, speakers: c.speakers, voice: c.voice, script: c.script,
}));

fs.mkdirSync(path.dirname(OUT_TESTS), { recursive: true });
fs.writeFileSync(OUT_TESTS, `${JSON.stringify(testsOut, null, 2)}\n`);
fs.writeFileSync(OUT_CLIPS, `${JSON.stringify(clipsOut, null, 2)}\n`);
const nq = testsOut.reduce((s, t) => s + t.questions.length, 0);
console.log(`Validated ${testsOut.length} tests, ${clipsOut.length} clips, ${nq} questions → ${path.relative(root, OUT_TESTS)}, ${path.relative(root, OUT_CLIPS)}`);
