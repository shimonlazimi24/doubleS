#!/usr/bin/env node
/**
 * Parses the content owner's writing package (two .docx files, exported to
 * plain text one paragraph per line) into the owner JSON the course reads:
 *
 *   content/amirant-import/owner/writing-tasks.json  - 14 tasks: prompt, rubric,
 *     method tips, useful phrases, three sample essays with their analysis, words
 *   content/amirant-import/owner/writing-guide.json  - the info sheet: exam facts,
 *     the high-level checklist, the 12-minute plan, key phrases by role, ready-made
 *     openings and closings, upgrades, common Hebrew-speaker errors, final check
 *
 * Usage: node scripts/writing/parse-writing-docs.mjs <tasks.txt> <info.txt>
 * (The .txt files are the docx paragraphs, see docx-to-text below.)
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "content/amirant-import/owner");

/** A .docx is a zip; the document paragraphs become lines (python -I: no site imports). */
function docxToText(file) {
  if (!file.endsWith(".docx")) return fs.readFileSync(file, "utf8");
  const py = [
    "import re,sys,html,zipfile",
    "x=zipfile.ZipFile(sys.argv[1]).read('word/document.xml').decode('utf8')",
    "x=re.sub(r'</w:p>','\\n',x); x=re.sub(r'<w:tab/>','\\t',x); x=re.sub(r'<[^>]+>','',x)",
    "sys.stdout.write(html.unescape(x))",
  ].join("\n");
  return execFileSync("python3", ["-I", "-c", py, file], { encoding: "utf8", maxBuffer: 64 << 20 });
}

const clean = (s) => String(s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const wordCount = (s) => clean(s).split(/\s+/).filter(Boolean).length;
/** "💡 תבנית 4 חלקים — …" → { title, body }; the emoji is the document's, not ours. */
function splitTip(line) {
  const t = clean(line).replace(/^💡\s*/, "");
  const m = t.match(/^(.+?)\s+[—–-]\s+(.+)$/);
  return m ? { title: m[1], body: m[2] } : { title: "", body: t };
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

const LEVEL_OF = { "רמה נמוכה": "low", "רמה בינונית": "mid", "רמה גבוהה": "high" };

export function parseTasks(text) {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const starts = [];
  lines.forEach((l, i) => {
    if (/^מטלה \d+$/.test(clean(l))) starts.push(i);
  });
  const tasks = [];
  starts.forEach((start, k) => {
    const end = k + 1 < starts.length ? starts[k + 1] : lines.length;
    const block = lines.slice(start, end);
    const n = Number(clean(block[0]).replace("מטלה ", ""));
    const at = (re) => block.findIndex((l) => re.test(clean(l)));

    // The prompt: everything between "Write a response…" and the "Write 90–120 words" line.
    const promptStart = at(/^Write a response to the topic below\.?$/);
    const limitsLine = at(/^Write 90[–-]120 words/);
    if (promptStart < 0 || limitsLine < 0) throw new Error(`task ${n}: prompt block not found`);
    const prompt = block
      .slice(promptStart + 1, limitsLine)
      .map(clean)
      .filter(Boolean)
      .join(" ");

    // The rubric: two dimensions × three levels, in document order.
    const rubricAt = at(new RegExp(`^מטלה ${n} [–-] מחוון`));
    if (rubricAt < 0) throw new Error(`task ${n}: rubric not found`);
    const cells = block.slice(rubricAt + 1).map(clean).filter(Boolean);
    const expectHeader = ["ממד", "רמה נמוכה", "רמה בינונית", "רמה גבוהה", "תוכן וארגון"];
    expectHeader.forEach((h, i) => {
      if (cells[i] !== h) throw new Error(`task ${n}: rubric header mismatch at ${i}: ${cells[i]}`);
    });
    if (cells[8] !== "שפה: עושר ודיוק") throw new Error(`task ${n}: language rubric row missing`);
    const rubric = {
      content: { low: cells[5], mid: cells[6], high: cells[7] },
      language: { low: cells[9], mid: cells[10], high: cells[11] },
    };

    // Method tips: Hebrew line with 💡 followed by its English line.
    const methodAt = at(/^שיטת העבודה$/);
    const phrasesAt = at(/^ביטויים שימושיים לנושא$/);
    const method = [];
    for (let i = methodAt + 1; i < phrasesAt; i++) {
      const l = clean(block[i]);
      if (!l.startsWith("💡")) continue;
      const { title, body } = splitTip(l);
      const en = clean(block[i + 1] ?? "");
      method.push({ titleHe: title, bodyHe: body, bodyEn: en.startsWith("💡") ? "" : en });
    }
    const usefulPhrases = clean(block[phrasesAt + 1] ?? "")
      .split(" · ")
      .map(clean)
      .filter(Boolean);

    // Samples: header, essay, Hebrew analysis, English analysis.
    const samples = [];
    block.forEach((l, i) => {
      const m = clean(l).match(/^חיבור לדוגמה [–-] (רמה \S+) \((\d+) מילים\)$/);
      if (!m) return;
      const level = LEVEL_OF[m[1]];
      if (!level) throw new Error(`task ${n}: unknown sample level ${m[1]}`);
      samples.push({
        level,
        statedWords: Number(m[2]),
        essay: clean(block[i + 1]),
        analysisHe: clean(block[i + 2]),
        analysisEn: clean(block[i + 3]),
      });
    });

    const wordsAt = at(/^מילים לשינון:/);
    const words = [];
    if (wordsAt >= 0) {
      for (let i = wordsAt; i < block.length; i++) {
        const l = clean(block[i]);
        if (!l) continue;
        const body = l.replace(/^מילים לשינון:\s*/, "");
        const m = body.match(/^(.+?)\s+\[(.+?)\]\s+[–-]\s+(.+)$/);
        words.push(m ? { word: m[1], pronunciation: m[2], meaningHe: m[3] } : { word: body, pronunciation: "", meaningHe: "" });
      }
    }

    tasks.push({
      id: `writing-task-${String(n).padStart(2, "0")}`,
      n,
      prompt,
      wordRange: [90, 120],
      minutes: 12,
      rubric,
      method,
      usefulPhrases,
      samples,
      words,
    });
  });
  return tasks;
}

/* ------------------------------------------------------------------ */
/* Info sheet                                                          */
/* ------------------------------------------------------------------ */

/** Section boundaries are the plain headings (no bullet, no table cell). */
const GUIDE_HEADINGS = [
  "מבנה המשימה ושיטת הציון",
  "איך נראית תשובה ברמה גבוהה",
  "תוכנית ל-12 דקות",
  "ביטויי מפתח לפי תפקיד",
  "משפטי פתיחה וסיום מוכנים",
  "שדרוגים: מניסוח פשוט לניסוח עשיר",
  "8 הטעויות הנפוצות של דוברי עברית",
  "בדיקה אחרונה לפני ההגשה",
];

function sectionLines(lines, heading) {
  const i = lines.findIndex((l) => clean(l) === heading);
  if (i < 0) throw new Error(`guide: heading not found: ${heading}`);
  let j = i + 1;
  while (j < lines.length && !GUIDE_HEADINGS.includes(clean(lines[j]))) j++;
  return lines.slice(i + 1, j).map(clean);
}

const bullets = (ls) => ls.filter((l) => l.startsWith("•")).map((l) => clean(l.slice(1)));
const checks = (ls) => ls.filter((l) => l.startsWith("☐")).map((l) => clean(l.slice(1)));

/** A 4-column phrase table: group title, 3 blank cells, then rows of 4 cells. */
function phraseGroups(ls, header) {
  // Blank cells (the three empty columns after a group title) carry nothing.
  const cells = ls.filter((l) => l && !l.startsWith("•"));
  const h = cells.findIndex((c, i) => header.every((x, k) => cells[i + k] === x));
  if (h < 0) throw new Error("guide: phrase table header not found");
  const body = cells.slice(h + header.length);
  const groups = [];
  let i = 0;
  // A row starts with the English phrase; anything else at row position is a group title.
  const isLatin = (s) => /^[A-Za-z…]/.test(s);
  while (i < body.length) {
    const cell = body[i];
    if (!isLatin(cell)) {
      groups.push({ roleHe: cell, phrases: [] });
      i += 1;
      continue;
    }
    const g = groups[groups.length - 1];
    if (!g) throw new Error(`guide: phrase row before any group: ${cell}`);
    const [en, he, when, level] = body.slice(i, i + 4);
    g.phrases.push({ en, he, whenHe: when, level: level === "מתקדם" ? "advanced" : "basic" });
    i += 4;
  }
  return groups;
}

/** A 3-column table (instead / write / note). */
function threeColumnRows(ls, header) {
  const cells = ls.filter((l) => !l.startsWith("•") && l);
  const h = cells.findIndex((c, i) => header.every((x, k) => cells[i + k] === x));
  if (h < 0) throw new Error("guide: 3-column table header not found");
  const body = cells.slice(h + header.length);
  const rows = [];
  for (let i = 0; i + 2 < body.length; i += 3) rows.push({ insteadOf: body[i], write: body[i + 1], noteHe: body[i + 2] });
  return rows;
}

export function parseGuide(text) {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const structure = sectionLines(lines, GUIDE_HEADINGS[0]);
  const high = sectionLines(lines, GUIDE_HEADINGS[1]);
  const plan = sectionLines(lines, GUIDE_HEADINGS[2]);
  const phrases = sectionLines(lines, GUIDE_HEADINGS[3]);
  const openings = sectionLines(lines, GUIDE_HEADINGS[4]);
  const upgrades = sectionLines(lines, GUIDE_HEADINGS[5]);
  const errors = sectionLines(lines, GUIDE_HEADINGS[6]);
  const finalCheck = sectionLines(lines, GUIDE_HEADINGS[7]);
  const PHRASE_HEADER = ["ביטוי", "פירוש", "מתי משתמשים", "רמה"];
  return {
    exam: {
      wordRange: [90, 120],
      minutes: 12,
      targetWords: 105,
      dimensions: [
        { id: "content", titleHe: "תוכן וארגון" },
        { id: "language", titleHe: "שפה: עושר ודיוק" },
      ],
      levels: [
        { id: "low", titleHe: "נמוכה" },
        { id: "mid", titleHe: "בינונית" },
        { id: "high", titleHe: "גבוהה" },
      ],
      /** The practice grader's floor: under this or off topic is at most "low" on content. */
      minWordsForGrading: 50,
      notesHe: bullets(structure),
    },
    highLevelChecklistHe: checks(high),
    plan: {
      notesHe: bullets(plan),
    },
    phrases: {
      notesHe: bullets(phrases),
      groups: phraseGroups(phrases, PHRASE_HEADER),
    },
    openingsAndClosings: {
      notesHe: bullets(openings),
      groups: phraseGroups(openings, PHRASE_HEADER),
    },
    upgrades: {
      notesHe: bullets(upgrades),
      rows: threeColumnRows(upgrades, ["במקום", "כדאי לכתוב", "הערה"]),
    },
    commonErrors: {
      notesHe: bullets(errors),
      rows: threeColumnRows(errors, ["במקום", "כדאי לכתוב", "הערה"]),
    },
    finalCheckHe: checks(finalCheck),
  };
}

/* ------------------------------------------------------------------ */
/* Validation + write                                                  */
/* ------------------------------------------------------------------ */

export function validate(tasks, guide) {
  const problems = [];
  if (tasks.length !== 14) problems.push(`expected 14 tasks, got ${tasks.length}`);
  const samples = tasks.flatMap((t) => t.samples);
  if (samples.length !== 42) problems.push(`expected 42 samples, got ${samples.length}`);
  for (const t of tasks) {
    if (!t.prompt.endsWith("?") && !t.prompt.endsWith(".")) problems.push(`${t.id}: odd prompt end: ${t.prompt.slice(-30)}`);
    for (const d of ["content", "language"]) {
      for (const l of ["low", "mid", "high"]) {
        if (!t.rubric[d][l] || t.rubric[d][l].length < 20) problems.push(`${t.id}: rubric ${d}.${l} too short`);
      }
    }
    const levels = t.samples.map((s) => s.level).sort().join(",");
    if (levels !== "high,low,mid") problems.push(`${t.id}: sample levels ${levels}`);
    for (const s of t.samples) {
      const wc = wordCount(s.essay);
      if (Math.abs(wc - s.statedWords) > 3) problems.push(`${t.id} ${s.level}: ${wc} words, document says ${s.statedWords}`);
      if (!s.analysisHe || !/[֐-׿]/.test(s.analysisHe)) problems.push(`${t.id} ${s.level}: Hebrew analysis missing`);
    }
    if (t.method.length < 2) problems.push(`${t.id}: method tips ${t.method.length}`);
    if (t.usefulPhrases.length < 3) problems.push(`${t.id}: useful phrases ${t.usefulPhrases.length}`);
  }
  if (guide.highLevelChecklistHe.length !== 10) problems.push(`checklist ${guide.highLevelChecklistHe.length}`);
  if (guide.phrases.groups.length < 8) problems.push(`phrase groups ${guide.phrases.groups.length}`);
  if (guide.commonErrors.rows.length !== 8) problems.push(`common errors ${guide.commonErrors.rows.length}`);
  if (guide.finalCheckHe.length !== 6) problems.push(`final check ${guide.finalCheckHe.length}`);
  return problems;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;
if (isMain) {
  const [tasksFile, infoFile] = process.argv.slice(2);
  if (!tasksFile || !infoFile) {
    console.error("usage: parse-writing-docs.mjs <tasks.docx|txt> <info.docx|txt>");
    process.exit(2);
  }
  const tasks = parseTasks(docxToText(tasksFile));
  const guide = parseGuide(docxToText(infoFile));
  const problems = validate(tasks, guide);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "writing-tasks.json"), `${JSON.stringify(tasks, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "writing-guide.json"), `${JSON.stringify(guide, null, 2)}\n`);
  const phraseCount = guide.phrases.groups.reduce((s, g) => s + g.phrases.length, 0);
  console.log(
    `${tasks.length} tasks, ${tasks.flatMap((t) => t.samples).length} samples, ${phraseCount} key phrases, ${guide.commonErrors.rows.length} common errors → ${path.relative(ROOT, OUT_DIR)}/`,
  );
}
