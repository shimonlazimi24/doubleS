/**
 * ייבוא שאלות סימולציות 2–4 מקבצי ה-md אל בנק השאלות (questions.json) —
 * עד עכשיו רק סימולציה 1 הייתה בבנק, וזמן-הריצה של סימולציות 2–4 שאב
 * שאלות גנריות במקום השאלות הייעודיות שנכתבו להן.
 *
 * מפרק: שאלות (**QN.** + אופציות A–D), מפתח תשובות (#### ✅ QN – **(X) ...**)
 * עם ההסבר המלא, וקטע קריאה לפרק הבנת הנקרא. פרקים ניסיוניים (🧪 Grammar /
 * Word Formation) מדולגים — אינם נושאי בנק.
 *
 * אידמפוטנטי: שאלות שכבר קיימות לא מיובאות שוב.
 * הרצה: node scripts/import-simulation-questions.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SIM_DIR = path.join(ROOT, "content/amirnet-course/08_full_simulations");
const QUESTIONS_JSON = path.join(ROOT, "content/amirant-import/source/questions.json");
const PASSAGES_JSON = path.join(ROOT, "content/amirant-import/source/passages.json");

const SIMS = [
  { file: "simulation_2_warmup.md", tag: "simulation-2-warmup", difficulty: 3 },
  { file: "simulation_3_challenge.md", tag: "simulation-3-challenge", difficulty: 4 },
  { file: "simulation_4_final.md", tag: "simulation-4-final", difficulty: 5 },
];

function sectionTopic(header) {
  if (/sentence\s*completion/i.test(header)) return "sentence_completion";
  if (/reading/i.test(header)) return "reading_comprehension";
  if (/restatement|rephras/i.test(header)) return "rephrasing";
  return null; // Grammar / Word Formation / Listening — לא נושאי בנק
}

function subtopicFor(topic) {
  if (topic === "sentence_completion") return "sentence_completion-simulation";
  if (topic === "rephrasing") return "rephrasing-simulation-restatement";
  return "reading_comprehension-simulation-mixed";
}

function parseSimulation(filePath, tag, difficulty) {
  const text = fs.readFileSync(filePath, "utf8");
  const answerKeyIdx = text.search(/^##\s+📝?\s*Part 2: Answer Key/m);
  if (answerKeyIdx === -1) throw new Error(`${path.basename(filePath)}: Answer Key section not found`);
  const questionsPart = text.slice(0, answerKeyIdx);
  const answersPart = text.slice(answerKeyIdx);

  // ── מפתח תשובות: #### ✅ Q1 – **(A) rapid** + הסבר עד הכותרת הבאה ──
  const answers = new Map(); // qNum -> {letter, explanation}
  const ansRe = /^####\s*✅?\s*Q(\d+)\s*[–-]\s*\*\*\(([A-D])\)[^\n]*\n([\s\S]*?)(?=^####|^###|^##|\n---\n(?=\s*^####)|$(?![\s\S]))/gim;
  let am;
  while ((am = ansRe.exec(answersPart)) !== null) {
    const explanation = am[3]
      .replace(/^\s*---\s*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    answers.set(Number(am[1]), { letter: am[2].toLowerCase(), explanation });
  }

  // ── שאלות לפי פרקים ──
  const lines = questionsPart.split("\n");
  const questions = []; // {qNum, topic, prompt, options, passageId?}
  let currentTopic = null;
  let isExperimental = false;
  let passageLines = null;
  let passageCaptured = "";

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const section = line.match(/^###\s+(.*)$/);
    if (section) {
      isExperimental = /🧪|ניסיוני/.test(section[1]);
      currentTopic = isExperimental ? null : sectionTopic(section[1]);
      // פרק הבנת הנקרא: אוספים את הקטע (בלוקציטוט/פסקאות עד השאלה הראשונה)
      passageLines = currentTopic === "reading_comprehension" ? [] : null;
      i++;
      continue;
    }

    const q = line.match(/^\*\*Q(\d+)\.\*\*\s*(.*)$/);
    if (q && currentTopic) {
      if (passageLines && passageLines.length && !passageCaptured) {
        passageCaptured = passageLines
          .join("\n")
          .replace(/^\s*---\s*$/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }
      passageLines = null;

      const qNum = Number(q[1]);
      let prompt = q[2].trim();
      const options = [];
      i++;
      // ממשיכים לקרוא את גוף השאלה + אופציות עד השאלה/כותרת הבאה
      while (i < lines.length && !/^\*\*Q\d+\.\*\*/.test(lines[i]) && !/^###?#?\s/.test(lines[i])) {
        const opt = lines[i].match(/^\(([A-D])\)\s+(.*)$/);
        if (opt) {
          options.push({ id: opt[1].toLowerCase(), label: opt[2].trim() });
        } else if (lines[i].trim() && lines[i].trim() !== "---" && options.length === 0) {
          prompt += "\n" + lines[i].trim();
        }
        i++;
      }
      questions.push({ qNum, topic: currentTopic, prompt: prompt.trim(), options });
      continue;
    }

    if (passageLines != null && line.trim() && !/^\*\*Q\d+/.test(line)) {
      passageLines.push(line);
    }
    i++;
  }

  // ── הרכבה לשורות בנק ──
  const rows = [];
  const problems = [];
  let passage = null;
  const rcQuestionIds = [];

  for (const q of questions) {
    const ans = answers.get(q.qNum);
    const id = `${tag}-q${q.qNum}`;
    if (!ans) { problems.push(`${id}: no answer key`); continue; }
    if (q.options.length !== 4) { problems.push(`${id}: ${q.options.length} options`); continue; }
    if (!q.options.some((o) => o.id === ans.letter)) { problems.push(`${id}: answer ${ans.letter} not in options`); continue; }
    if (!ans.explanation) { problems.push(`${id}: empty explanation`); continue; }

    const row = {
      questionId: id,
      topic: q.topic,
      subtopic: subtopicFor(q.topic),
      difficultyLevel: difficulty,
      questionText: q.prompt,
      options: q.options,
      correctOptionId: ans.letter,
      explanation: ans.explanation,
      distractorExplanations: {},
      estimatedTimeSec: q.topic === "reading_comprehension" ? 110 : 65,
      tags: ["imported", "real_markdown", tag, "simulation", `difficulty_${difficulty}`],
    };
    if (q.topic === "reading_comprehension") rcQuestionIds.push(id);
    rows.push(row);
  }

  if (passageCaptured && rcQuestionIds.length) {
    passage = {
      passageId: `${tag}-p1`,
      title: "",
      bodyMarkdown: passageCaptured,
      sourceTag: tag,
    };
    for (const row of rows) {
      if (rcQuestionIds.includes(row.questionId)) row.passageId = passage.passageId;
    }
  }

  return { rows, passage, problems };
}

const existing = JSON.parse(fs.readFileSync(QUESTIONS_JSON, "utf8"));
const existingIds = new Set(existing.map((q) => q.questionId));
const passages = JSON.parse(fs.readFileSync(PASSAGES_JSON, "utf8"));
const existingPassageIds = new Set(passages.map((p) => p.passageId));

let added = 0;
for (const sim of SIMS) {
  const { rows, passage, problems } = parseSimulation(path.join(SIM_DIR, sim.file), sim.tag, sim.difficulty);
  if (problems.length) console.warn(sim.tag, "skipped:", problems);
  const fresh = rows.filter((r) => !existingIds.has(r.questionId));
  existing.push(...fresh);
  added += fresh.length;
  if (passage && !existingPassageIds.has(passage.passageId)) passages.push(passage);
  console.log(`${sim.tag}: parsed ${rows.length}, added ${fresh.length}${passage ? ", passage ✓" : ""}`);
}

fs.writeFileSync(QUESTIONS_JSON, JSON.stringify(existing, null, 2) + "\n", "utf8");
fs.writeFileSync(PASSAGES_JSON, JSON.stringify(passages, null, 2) + "\n", "utf8");
console.log(`total added: ${added}, bank now: ${existing.length}`);
