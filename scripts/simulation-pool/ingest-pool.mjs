/**
 * Puts one wave of the owner's simulation question pool into the course.
 *
 * Input: the owner's POOL-<wave>_index.json (sim_id, section_times, levels,
 * score anchors, pools by type and level, items with full text and keys).
 *
 * Writes:
 *   - content/amirant-import/owner/simulation-pool/<sim_id>.json: the wave in
 *     one normalised shape (what the adaptive engine reads)
 *   - content/amirant-import/owner/simulation-pool/index.json: the waves
 *   - content/amirant-import/owner/simulation-pool/listening-clips.json: the
 *     recording briefs of every wave's clips, in the shape
 *     scripts/listening/generate-audio.mjs reads (--clips)
 *   - questions.json / passages.json: the multiple-choice items (sentence
 *     completion, restatement, reading sets, listening clips) tagged
 *     owner_sim_pool + owner-sim-pool-<wave>, so the general pools, quizzes
 *     and the fixed simulations never draw them (reserved-tags.ts)
 *
 * Word-formation and writing items stay in the wave file; the engine serves
 * them through their own stores. Re-running replaces the wave's rows.
 * A second wave is one more run: node scripts/simulation-pool/ingest-pool.mjs ~/Downloads/POOL-S2_index.json
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/simulation-pool/ingest-pool.mjs <POOL-Sn_index.json>");
  process.exit(2);
}
const POOL_DIR = path.join(root, "content/amirant-import/owner/simulation-pool");
const INDEX = path.join(POOL_DIR, "index.json");
const CLIPS = path.join(POOL_DIR, "listening-clips.json");
const BANK = path.join(root, "content/amirant-import/source/questions.json");
const PASSAGES = path.join(root, "content/amirant-import/source/passages.json");
const TAG = "owner_sim_pool";
const OPTION_IDS = ["a", "b", "c", "d"];

const raw = JSON.parse(fs.readFileSync(src, "utf8"));
const simId = String(raw.sim_id);
const waveTag = `owner-sim-pool-${simId.toLowerCase()}`;
const prefix = `sim-${simId.toLowerCase()}`;

const TOPIC_BY_TYPE = {
  sentence_completion: "sentence_completion",
  restatement: "rephrasing",
  reading_set: "reading_comprehension",
  listening_lecture: "listening",
};

const indexById = new Map();
for (const row of raw.index) {
  const list = indexById.get(row.item_id) ?? [];
  list.push(row);
  indexById.set(row.item_id, list);
}

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};
const correctIndex = (options, answer, where) => {
  const i = options.indexOf(answer);
  if (i < 0) fail(`${where}: answer is not one of the options`);
  return i;
};
const explanation = (short) => ({ he: short?.he ?? "", en: short?.en ?? "" });
/** "Lecturer (female)" / ["A: female student", "B: male student"] → the briefs' speaker line. */
const speakersLine = (speakers) => speakers.join(" | ");
const subtopic = (stem, base) => {
  const s = stem.toLowerCase();
  if (/mainly|main (point|idea|topic|purpose|argument)|purpose of the (passage|lecture|talk)/.test(s)) return `${base}-main-idea`;
  if (/suggest|imply|infer|attitude|position|probably|most likely|agree|opinion|by the end|why does/.test(s)) return `${base}-inference`;
  return `${base}-detail`;
};

const items = [];
const bankRows = [];
const passageRows = [];
const briefs = [];

for (const [id, it] of Object.entries(raw.items)) {
  const rows = indexById.get(id) ?? [];
  const meta = rows[0] ?? {};
  const level = Number(it.level);
  if (!(level >= 1 && level <= 6)) fail(`${id}: level ${it.level}`);
  const base = {
    id,
    type: it.type,
    level,
    b: it.b ?? meta.difficulty ?? level,
    topic: meta.topic ?? null,
    method: meta.primary_method ?? null,
    group: meta.group || null,
    related: rows.map((r) => r.related).filter(Boolean)[0] ?? null,
  };
  const difficultyTags = [TAG, waveTag, `difficulty_${level}`];

  if (it.type === "sentence_completion" || it.type === "restatement") {
    const correct = correctIndex(it.options, it.answer, id);
    const questionId = `${prefix}-${id.toLowerCase()}`;
    items.push({ ...base, questionId, stem: it.stem, options: it.options, correct, explanation: explanation(it.short) });
    bankRows.push({
      questionId,
      topic: TOPIC_BY_TYPE[it.type],
      subtopic: it.type === "restatement" ? "rephrasing-meaning-equivalence" : "sentence_completion-vocabulary-in-context",
      difficultyLevel: level,
      // Restatement stems carry the owner's "Original: " marker, as the practice sets do.
      questionText: it.type === "restatement" && !/^original:/i.test(it.stem) ? `Original: ${it.stem}` : it.stem,
      options: it.options.map((label, i) => ({ id: OPTION_IDS[i], label })),
      correctOptionId: OPTION_IDS[correct],
      explanation: `**הסבר קצר:** ${it.short.he}\n\n_${it.short.en}_`,
      distractorExplanations: {},
      estimatedTimeSec: it.type === "restatement" ? 120 : 60,
      tags: difficultyTags,
    });
    continue;
  }

  if (it.type === "reading_set") {
    const passageId = `${prefix}-${id.toLowerCase()}`;
    const questions = it.questions.map((q) => {
      const correct = correctIndex(q.options, q.answer, `${id}/${q.qid}`);
      return { qid: q.qid, questionId: `${passageId}-${q.qid}`, stem: q.stem, options: q.options, correct, b: q.b ?? base.b, explanation: explanation(q.short) };
    });
    if (questions.length !== 5) fail(`${id}: ${questions.length} questions, expected 5`);
    items.push({ ...base, passageId, title: it.title, paragraphs: it.paragraphs, glossary: it.glossary ?? [], questions });
    const body = it.paragraphs.join("\n\n");
    const glossary = (it.glossary ?? []).length
      ? `\n\n**Glossary**\n\n${it.glossary.map((g) => `${g.word} [${g.pronunciation}] — ${g.he}. _${g.en}_`).join("\n\n")}`
      : "";
    passageRows.push({ passageId, title: it.title, bodyMarkdown: `${body}${glossary}`, sourceTag: waveTag });
    for (const q of questions) {
      bankRows.push({
        questionId: q.questionId,
        topic: "reading_comprehension",
        subtopic: subtopic(q.stem, "reading_comprehension"),
        difficultyLevel: level,
        questionText: q.stem,
        options: q.options.map((label, i) => ({ id: OPTION_IDS[i], label })),
        correctOptionId: OPTION_IDS[q.correct],
        explanation: `**הסבר קצר:** ${q.explanation.he}\n\n_${q.explanation.en}_`,
        distractorExplanations: {},
        estimatedTimeSec: 180,
        passageId,
        tags: difficultyTags,
      });
    }
    continue;
  }

  if (it.type === "listening_lecture") {
    const passageId = `${prefix}-${id.toLowerCase()}`;
    const clipSeconds = Number(it.secs);
    const questions = it.questions.map((q) => {
      const correct = correctIndex(q.options, q.answer, `${id}/${q.qid}`);
      return { qid: q.qid, questionId: `${passageId}-${q.qid}`, stem: q.stem, options: q.options, correct, b: q.b ?? base.b, explanation: explanation(q.short) };
    });
    const expectedQ = clipSeconds === 30 ? 1 : 2;
    if (questions.length !== expectedQ) fail(`${id}: ${questions.length} questions for a ${clipSeconds}s clip`);
    const script = it.script.map((line) => {
      const m = line.match(/^([AB]):\s*(.+)$/s);
      return m ? { speaker: m[1], text: m[2].trim() } : { speaker: null, text: line.trim() };
    });
    items.push({
      ...base,
      clipSeconds,
      passageId,
      clipId: id,
      context: it.context,
      speakers: it.speakers,
      voiceDirection: it.voice_direction ?? "",
      script: it.script,
      questions,
    });
    briefs.push({
      id,
      level,
      seconds: clipSeconds,
      words: it.script.join(" ").split(/\s+/).filter(Boolean).length,
      speakers: speakersLine(it.speakers),
      voice: it.voice_direction,
      script,
    });
    const transcript = script.map((l) => (l.speaker ? `**${l.speaker}:** ${l.text}` : l.text)).join("\n\n");
    passageRows.push({
      passageId,
      title: `קטע שמע · כ-${clipSeconds} שניות`,
      bodyMarkdown: `{{audio:ls-${id}|קטע שמע}}\n\n${it.context}`,
      revealMarkdown: `**תמליל הקטע**\n\n${transcript}`,
      sourceTag: waveTag,
    });
    for (const q of questions) {
      bankRows.push({
        questionId: q.questionId,
        topic: "listening",
        subtopic: subtopic(q.stem, "listening"),
        difficultyLevel: level,
        questionText: q.stem,
        options: q.options.map((label, i) => ({ id: OPTION_IDS[i], label })),
        correctOptionId: OPTION_IDS[q.correct],
        explanation: `**הסבר קצר:** ${q.explanation.he}\n\n_${q.explanation.en}_`,
        distractorExplanations: {},
        estimatedTimeSec: 84,
        passageId,
        tags: difficultyTags,
      });
    }
    continue;
  }

  if (it.type === "word_formation") {
    if (!it.accepted?.includes(it.answer)) fail(`${id}: answer not in accepted`);
    items.push({
      ...base,
      questionId: `${prefix}-${id.toLowerCase()}`,
      sentence: it.sentence,
      baseWord: it.base_word,
      accepted: it.accepted,
      answer: it.answer,
      explanation: explanation(it.short),
    });
    continue;
  }

  if (it.type === "writing_task") {
    const rubric = Object.fromEntries(
      (it.rubric ?? []).map((r) => [r.dimension.startsWith("תוכן") ? "content" : "language", r.high]),
    );
    items.push({
      ...base,
      taskId: `${prefix}-${id.toLowerCase()}`,
      prompt: it.prompt,
      wordRange: it.word_range ?? [90, 120],
      highModel: it.high_model,
      rubricHigh: { content: rubric.content ?? "", language: rubric.language ?? "" },
    });
    continue;
  }

  fail(`${id}: unknown type ${it.type}`);
}

// Validation against the owner's own counts and pools.
const questionCount = items.reduce((n, it) => n + (it.questions ? it.questions.length : 1), 0);
if (items.length !== Object.keys(raw.items).length) fail("item count drift");
if (questionCount !== raw.index.length) fail(`${questionCount} questions vs ${raw.index.length} index rows`);
const have = new Set(items.map((it) => it.id));
for (const [type, levels] of Object.entries(raw.pools)) {
  for (const [lvl, ids] of Object.entries(levels)) {
    for (const id of ids) {
      if (!have.has(id)) fail(`pools.${type}.${lvl}: ${id} has no item`);
      const it = raw.items[id];
      if (it.type !== type || Number(it.level) !== Number(lvl)) fail(`pools.${type}.${lvl}: ${id} is ${it.type} L${it.level}`);
    }
  }
}
for (const [secs, levels] of Object.entries(raw.listening_by_length)) {
  for (const [lvl, ids] of Object.entries(levels)) {
    for (const id of ids) {
      const it = raw.items[id];
      if (!it || it.type !== "listening_lecture" || Number(it.secs) !== Number(secs) || Number(it.level) !== Number(lvl)) {
        fail(`listening_by_length.${secs}.${lvl}: ${id}`);
      }
    }
  }
}

// Overlap with the practice banks: ids, stand-alone stems, and passage or
// transcript text. A passage-bound stem such as "What is the main purpose of
// the passage?" repeats by the exam's design, so for those the passage is
// what must be new.
const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
const others = bank.filter((q) => !(q.tags ?? []).includes(waveTag));
const allP = JSON.parse(fs.readFileSync(PASSAGES, "utf8"));
const keptP = allP.filter((p) => p.sourceTag !== waveTag && p.sourceTag !== TAG && !p.passageId.startsWith("simpool-"));
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const otherIds = new Set(others.map((q) => q.questionId));
const otherStems = new Map(others.filter((q) => !q.passageId).map((q) => [norm(q.questionText), q.questionId]));
const stripAudio = (md) => md.replace(/\{\{audio:[^}]*\}\}/g, "");
const otherPassages = new Map(keptP.map((p) => [norm(stripAudio(p.revealMarkdown ?? p.bodyMarkdown)), p.passageId]));
const overlap = [];
for (const r of bankRows) {
  if (otherIds.has(r.questionId)) fail(`${r.questionId} already exists in the bank`);
  if (r.passageId) continue;
  const twin = otherStems.get(norm(r.questionText));
  if (twin) overlap.push(`${r.questionId} ~ ${twin}`);
}
for (const p of passageRows) {
  const twin = otherPassages.get(norm(stripAudio(p.revealMarkdown ?? p.bodyMarkdown)));
  if (twin) overlap.push(`${p.passageId} ~ passage ${twin}`);
}

const wave = {
  simId,
  titleHe: raw.title_he,
  adaptivity: raw.adaptivity,
  sectionTimes: raw.section_times,
  startLevel: raw.start_level,
  scoreAnchors: raw.score_anchors,
  bands: raw.bands,
  experimentalBonus: raw.experimental_bonus,
  items,
};
fs.mkdirSync(POOL_DIR, { recursive: true });
fs.writeFileSync(path.join(POOL_DIR, `${simId}.json`), `${JSON.stringify(wave, null, 2)}\n`);

const index = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, "utf8")) : { waves: [] };
index.waves = index.waves.filter((w) => w.simId !== simId);
index.waves.push({
  simId,
  file: `${simId}.json`,
  items: items.length,
  questions: questionCount,
  ingestedAt: new Date().toISOString().slice(0, 10),
});
index.waves.sort((a, b) => a.simId.localeCompare(b.simId));
fs.writeFileSync(INDEX, `${JSON.stringify(index, null, 2)}\n`);

const existingBriefs = fs.existsSync(CLIPS) ? JSON.parse(fs.readFileSync(CLIPS, "utf8")) : [];
const keptBriefs = existingBriefs.filter((b) => !briefs.some((n) => n.id === b.id));
fs.writeFileSync(CLIPS, `${JSON.stringify([...keptBriefs, ...briefs], null, 2)}\n`);

fs.writeFileSync(BANK, `${JSON.stringify([...others, ...bankRows], null, 2)}\n`);
fs.writeFileSync(PASSAGES, `${JSON.stringify([...keptP, ...passageRows], null, 2)}\n`);

const byType = {};
for (const it of items) byType[it.type] = (byType[it.type] ?? 0) + 1;
console.log(`${simId}: ${items.length} items, ${questionCount} questions (${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(", ")})`);
console.log(`questions.json ${bank.length} → ${others.length + bankRows.length}; passages.json ${allP.length} → ${keptP.length + passageRows.length}; ${briefs.length} clip briefs`);
console.log(overlap.length ? `TEXT OVERLAP with practice bank (${overlap.length}):\n  ${overlap.join("\n  ")}` : "no question text overlaps the practice bank");
console.log("Next: node scripts/listening/generate-audio.mjs --clips content/amirant-import/owner/simulation-pool/listening-clips.json; node scripts/listening/ingest-listening-tests.mjs; npm run generate:course-manifest");
