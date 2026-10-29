/**
 * Turns the content owner's "דקדוק בהקשר – 12 מבחנים" document into the owner
 * JSON the course reads: content/amirant-import/owner/grammar-tests.json.
 *
 *   - howTo: the "איך לתרגל" bullets
 *   - methods: the four solving methods (Hebrew name, English name, when it helps)
 *   - tests[12].questions[4]: stem, options, the key, the short explanation
 *     (he + en), the full explanation, the method that solves it fastest, why
 *     each other option fails (he + en), an optional closing English summary,
 *     and the words to memorise (later tests only)
 *
 * Input is the plain text of the .docx (one paragraph per line, tabs mark
 * table cells). The 💡 / ✗ / ✓ marks of the source are parsed and dropped: the
 * course shows no emoji. Every check that fails aborts the run: nothing is
 * written.
 *
 * Usage: node scripts/grammar/parse-grammar-doc.mjs <grammar.txt>
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT = path.join(root, "content/amirant-import/owner/grammar-tests.json");

const [input] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node scripts/grammar/parse-grammar-doc.mjs <grammar.txt>");
  process.exit(2);
}

const errors = [];
const ls = fs
  .readFileSync(input, "utf8")
  .split("\n")
  .map((l) => l.replace(/ /g, " ").replace(/\s+$/, ""));

const isTestStart = (l) => /^מבחן \d+$/.test(l.trim());
const isKeyStart = (l) => /^מבחן \d+ – מפתח תשובות$/.test(l.trim());
const isSolStart = (l) => /^מבחן \d+ – פתרונות מלאים$/.test(l.trim());
const isBoundary = (l) => isTestStart(l) || isKeyStart(l) || isSolStart(l);

// ---------------------------------------------------------------- front matter

const firstTest = ls.findIndex(isTestStart);
const front = ls.slice(0, firstTest).map((l) => l.trim());
const howTo = front.filter((l) => l.startsWith("• ")).map((l) => l.slice(2).trim());

const methods = [];
{
  const start = front.indexOf("שיטות הפתרון");
  if (start < 0) errors.push("no שיטות הפתרון table");
  // Table cells: Hebrew name, English name, when it helps, in groups of three.
  const cells = front.slice(start + 2).filter((l) => l && l !== "שיטה" && l !== "מתי היא עוזרת");
  for (let i = 0; i + 2 < cells.length; i += 3) {
    methods.push({ nameHe: cells[i], nameEn: cells[i + 1], whenHe: cells[i + 2] });
  }
}

// ---------------------------------------------------------------- tests

const tests = new Map();
let i = firstTest;
const at = () => ls[i] ?? "";

while (i < ls.length) {
  const l = at().trim();
  if (isTestStart(l)) {
    const n = Number(l.match(/\d+/)[0]);
    const t = { number: n, questions: [], key: new Map() };
    tests.set(n, t);
    i++;
    let q = null;
    while (i < ls.length && !isBoundary(at())) {
      const s = at().trim();
      let m;
      if ((m = s.match(/^(\d)\.\s+(.+)$/))) {
        q = { number: Number(m[1]), stem: m[2].trim(), options: [], whyNot: [], words: [] };
        t.questions.push(q);
      } else if ((m = s.match(/^\((\d)\)\s+(.+)$/)) && q) {
        if (Number(m[1]) !== q.options.length + 1) errors.push(`test ${n} q${q.number}: option numbering jumps`);
        q.options.push(m[2].trim());
      }
      i++;
    }
    continue;
  }
  if (isKeyStart(l)) {
    const t = tests.get(Number(l.match(/\d+/)[0]));
    i++;
    while (i < ls.length && !isBoundary(at())) {
      const s = at().trim();
      if (/^\d$/.test(s)) {
        const qn = Number(s);
        let j = i + 1;
        while (j < ls.length && !ls[j].trim()) j++;
        const m = (ls[j] ?? "").trim().match(/^\((\d)\)\s+(.+)$/);
        if (!m) errors.push(`test ${t.number}: answer key for q${qn} has no "(k) text" line`);
        else t.key.set(qn, { pos: Number(m[1]), text: m[2].trim() });
        i = j + 1;
        continue;
      }
      i++;
    }
    continue;
  }
  if (isSolStart(l)) {
    const t = tests.get(Number(l.match(/\d+/)[0]));
    i++;
    let q = null;
    let section = null; // "short" | "full" | "whyNot"
    let pending = null; // the ✗ entry waiting for its English line
    while (i < ls.length && !isBoundary(at())) {
      const s = at().trim();
      let m;
      if ((m = s.match(/^שאלה (\d)$/))) {
        q = t.questions.find((x) => x.number === Number(m[1]));
        if (!q) errors.push(`test ${t.number}: solutions mention q${m[1]} which the test does not have`);
        section = null;
        pending = null;
        i++;
        continue;
      }
      if (!q || !s) { i++; continue; }
      if (s === "הסבר קצר") { section = "short"; i++; continue; }
      if (s === "הסבר מלא") { section = "full"; i++; continue; }
      if (s === "למה לא האפשרויות האחרות") { section = "whyNot"; i++; continue; }
      if ((m = s.match(/^💡\s*שיטה:\s*(.+?)\s+—\s+(.+)$/))) {
        q.method = { nameHe: m[1].trim(), he: m[2].trim(), nameEn: "", en: "" };
        section = "method";
        i++;
        continue;
      }
      if ((m = s.match(/^✓\s*תשובה סופית:\s*(.+)$/))) {
        q.final = m[1].trim();
        section = "after";
        i++;
        continue;
      }
      if ((m = s.match(/^מילים לשינון:\s*(.+)$/))) {
        for (const w of m[1].split(" · ")) {
          const wm = w.trim().match(/^(.+?)\s+\[([^\]]+)\]\s+–\s+(.+)$/);
          if (!wm) errors.push(`test ${t.number} q${q.number}: unreadable word line "${w.slice(0, 40)}"`);
          else q.words.push({ word: wm[1].trim(), pronunciation: wm[2].trim(), meaningHe: wm[3].trim() });
        }
        i++;
        continue;
      }
      if (section === "short") {
        if (!q.shortHe) q.shortHe = s;
        else if (!q.shortEn) q.shortEn = s;
        else errors.push(`test ${t.number} q${q.number}: extra line in the short explanation`);
      } else if (section === "full") {
        if (!q.fullHe) q.fullHe = s;
        else errors.push(`test ${t.number} q${q.number}: extra line in the full explanation`);
      } else if (section === "method") {
        // "What follows the word: ..." — the English method name, then the line.
        const em = s.match(/^(.+?):\s+(.+)$/);
        if (!em) errors.push(`test ${t.number} q${q.number}: English method line has no "Name:" prefix`);
        else {
          q.method.nameEn = em[1].trim();
          q.method.en = em[2].trim();
        }
        section = null;
      } else if (section === "whyNot") {
        if ((m = s.match(/^✗\s*(.+?)\s+—\s+(.+)$/))) {
          pending = { option: m[1].trim(), he: m[2].trim(), en: "" };
          q.whyNot.push(pending);
        } else if (pending && !pending.en) {
          pending.en = s;
        } else if (!q.finalNote) {
          q.finalNote = s;
        } else {
          errors.push(`test ${t.number} q${q.number}: unexpected line in why-not "${s.slice(0, 40)}"`);
        }
      } else if (section === "after") {
        errors.push(`test ${t.number} q${q.number}: unexpected line after the final answer "${s.slice(0, 40)}"`);
      } else if (section === null && q.options.length) {
        // The stem and the options repeated: nothing to parse.
      }
      i++;
    }
    continue;
  }
  i++;
}

// ---------------------------------------------------------------- checks

if (tests.size !== 12) errors.push(`${tests.size} tests (want 12)`);
if (methods.length !== 4) errors.push(`${methods.length} methods in the table (want 4)`);
if (howTo.length < 3) errors.push(`${howTo.length} how-to bullets (want at least 3)`);
const methodNames = new Set(methods.map((m) => m.nameHe));
const methodEn = new Map(methods.map((m) => [m.nameHe, m.nameEn]));

for (const t of [...tests.values()].sort((a, b) => a.number - b.number)) {
  const atT = `test ${t.number}`;
  if (t.questions.length !== 4) errors.push(`${atT}: ${t.questions.length} questions (want 4)`);
  for (const q of t.questions) {
    const qa = `${atT} q${q.number}`;
    if (q.options.length !== 4) errors.push(`${qa}: ${q.options.length} options`);
    if (new Set(q.options).size !== q.options.length) errors.push(`${qa}: duplicate options`);
    const k = t.key.get(q.number);
    if (!k) { errors.push(`${qa}: no answer key`); continue; }
    if (q.options[k.pos - 1] !== k.text) errors.push(`${qa}: answer key "(${k.pos}) ${k.text}" does not match option ${k.pos} "${q.options[k.pos - 1]}"`);
    q.correct = k.pos - 1;
    if (q.final !== k.text) errors.push(`${qa}: "תשובה סופית" (${q.final}) differs from the answer key`);
    if (!q.shortHe || !q.shortEn) errors.push(`${qa}: short explanation missing`);
    if (!q.fullHe) errors.push(`${qa}: full explanation missing`);
    if (!q.method) errors.push(`${qa}: no method line`);
    else {
      if (!methodNames.has(q.method.nameHe)) errors.push(`${qa}: method "${q.method.nameHe}" is not in the methods table`);
      else if (q.method.nameEn !== methodEn.get(q.method.nameHe)) errors.push(`${qa}: English method name "${q.method.nameEn}" does not match the table`);
      if (!q.method.en) errors.push(`${qa}: English method line missing`);
    }
    const wrong = q.options.filter((_, idx) => idx !== q.correct);
    if (q.whyNot.length !== 3) errors.push(`${qa}: ${q.whyNot.length} why-not entries (want 3)`);
    for (const w of q.whyNot) {
      if (!wrong.includes(w.option)) errors.push(`${qa}: why-not names "${w.option}", which is not a wrong option`);
      if (!w.en) errors.push(`${qa}: why-not "${w.option}" has no English line`);
    }
    const all = [q.shortHe, q.shortEn, q.fullHe, q.method?.he, q.method?.en, ...q.whyNot.flatMap((w) => [w.he, w.en]), q.finalNote].join(" ");
    if (/\(\s*[1-4]\s*\)|אפשרות [1-4]\b|תשובה [1-4]\b/.test(all)) errors.push(`${qa}: explanation refers to an option by number`);
  }
}

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} — nothing written:\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const out = {
  howTo,
  methods,
  tests: [...tests.values()].sort((a, b) => a.number - b.number).map((t) => ({
    number: t.number,
    questions: t.questions.map((q) => ({
      number: q.number,
      stem: q.stem,
      options: q.options,
      correct: q.correct,
      shortHe: q.shortHe,
      shortEn: q.shortEn,
      fullHe: q.fullHe,
      method: q.method,
      whyNot: q.whyNot,
      ...(q.finalNote ? { finalNote: q.finalNote } : {}),
      words: q.words,
    })),
  })),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
const nq = out.tests.reduce((s, t) => s + t.questions.length, 0);
const nw = out.tests.reduce((s, t) => s + t.questions.reduce((x, q) => x + q.words.length, 0), 0);
const byMethod = {};
for (const t of out.tests) for (const q of t.questions) byMethod[q.method.nameHe] = (byMethod[q.method.nameHe] ?? 0) + 1;
console.log(`Validated ${out.tests.length} tests, ${nq} questions, ${out.methods.length} methods, ${out.howTo.length} how-to bullets, ${nw} words to memorise → ${path.relative(root, OUT)}`);
console.log("Questions per method:", byMethod);
