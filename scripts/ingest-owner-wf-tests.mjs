/**
 * Imports the content owner's word-formation tests (יצירת מילה) from Word.
 *
 * Word formation is not multiple choice: the learner types one word, built
 * from the base word printed under the sentence. So these items do not go into
 * the multiple-choice bank (its schema needs four options). They are written
 * to content/amirant-import/owner/wf-tests.json, which only the server reads:
 * the lesson page sends each lesson its four sentences and base words, and
 * /api/prep/amirant-course/grade-word checks the typed answers.
 *
 * Document format: "מבחן N" (Heading1) with 4 numbered sentences, each followed
 * by its base word and an "Answer: ____" line; "מבחן N – מפתח תשובות" (all
 * accepted forms, "a / b" when several are right); "מבחן N – פתרונות מלאים"
 * with, per question: הסבר קצר (he + en), הסבר מלא, 💡 שיטה (he + en),
 * טעויות נפוצות (✗ form — Hebrew, then an English line), an English summary,
 * ✓ תשובה סופית, מילים לשינון.
 *
 * Checks, any failure aborts: one blank per sentence; key = "תשובה סופית";
 * every accepted form is letters only and differs from the base word, and
 * "תשובה סופית" names forms from the key; at least two listed mistakes; a form
 * is capitalized exactly when the blank opens the sentence (the document's
 * rule); no listed mistake is also an accepted form.
 *
 * A question keeps its published id while its sentence and base word are
 * unchanged, so a re-ordered or re-indexed delivery does not move learners'
 * answers onto another question.
 *
 * With the owner's index (same table as the other owner imports: unit,
 * question, id, level, primary, methods, topic, answer, difficulty, status),
 * each item also carries its level, methods, topic and review status. Every
 * question needs a row, and the row's answer must be one of the key's forms.
 * Rows still under review ("needs_owner_review", "qa_passed") are rejected
 * unless --accept-pending-review is given.
 *
 * Usage: npm run ingest:owner-wf -- <tests.docx> [<index.docx>] [--accept-pending-review]
 */
import fs from "node:fs";
import path from "node:path";
import { paragraphs, HEB, LEVEL, PENDING_STATUSES, readOwnerIndex } from "./lib/owner-docx.mjs";

const root = process.cwd();
const OUT = path.join(root, "content/amirant-import/owner/wf-tests.json");
const [docx, indexDocx] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const acceptPending = process.argv.includes("--accept-pending-review");
if (!docx) {
  console.error("Usage: node scripts/ingest-owner-wf-tests.mjs <tests.docx> [<index.docx>] [--accept-pending-review]");
  process.exit(2);
}

const BLANK = /_{4,}/g;
const STEM = /^(\d+)\.\s+(.*)$/;
const LETTERS = /^[A-Za-z]+$/;
// Hidden direction marks (U+200E/F) wrap the suffixes in the Hebrew text.
const clean = (t) => t.replace(/[‎‏]/g, "").trim();
const forms = (t) => clean(t).split("/").map((x) => x.trim()).filter(Boolean);

function read(file) {
  const tests = new Map();
  let cur = null, mode = null, q = null, sec = null, keyQ = null;
  for (const [style, raw] of paragraphs(file)) {
    const t = clean(raw);
    const h = style === "Heading1" && t.match(/^מבחן (\d+)$/);
    if (h) { cur = Number(h[1]); tests.set(cur, new Map()); mode = "q"; q = null; continue; }
    if (style === "Heading1" && /מפתח תשובות/.test(t)) { mode = "key"; keyQ = null; continue; }
    if (style === "Heading2" && /פתרונות מלאים/.test(t)) { mode = "sol"; q = null; continue; }
    if (style.startsWith("Heading")) { mode = null; continue; }
    if (cur == null || mode == null) continue;
    const T = tests.get(cur);
    if (mode === "q") {
      const m = t.match(STEM);
      if (m) { q = Number(m[1]); T.set(q, { n: q, sentence: m[2], base: null, key: null, sol: null }); continue; }
      if (q && T.get(q).base == null && !/^Answer:/.test(t)) T.get(q).base = t;
      continue;
    }
    if (mode === "key") {
      if (/^\d+$/.test(t)) { keyQ = Number(t); continue; }
      if (keyQ && T.has(keyQ) && !T.get(keyQ).key) T.get(keyQ).key = forms(t);
      continue;
    }
    if (mode === "sol") {
      const hq = t.match(/^שאלה (\d+)$/);
      if (hq) {
        q = Number(hq[1]);
        if (T.has(q)) T.get(q).sol = { sentence: null, base: null, short: [], full: [], method: [], mistakes: [], summaryEn: [], final: null, vocab: null };
        sec = "head";
        continue;
      }
      const S = q && T.get(q)?.sol;
      if (!S) continue;
      if (sec === "head") {
        if (t === "הסבר קצר") { sec = "short"; continue; }
        if (!S.sentence) S.sentence = t;
        else if (!S.base) S.base = t;
        continue;
      }
      if (t === "הסבר קצר") { sec = "short"; continue; }
      if (t === "הסבר מלא") { sec = "full"; continue; }
      if (t === "טעויות נפוצות") { sec = "mistakes"; continue; }
      if (t.startsWith("✓ תשובה סופית")) { S.final = forms(t.split(":").slice(1).join(":")); sec = "after"; continue; }
      if (t.startsWith("מילים לשינון")) { S.vocab = t.split(":").slice(1).join(":").trim(); continue; }
      if (sec === "after") continue;
      if (t.startsWith("💡 שיטה")) { sec = "method"; S.method.push(t); continue; }
      if (sec === "method") { S.method.push(t); continue; }
      if (sec === "mistakes") {
        const m = t.match(/^✗\s*(\S+)\s+—\s+(.*)$/);
        if (m) S.mistakes.push({ form: m[1], he: m[2], en: null });
        else if (S.mistakes.length && S.mistakes.at(-1).en == null && !HEB.test(t)) S.mistakes.at(-1).en = t;
        else S.summaryEn.push(t);
        continue;
      }
      if (sec === "short" || sec === "full") S[sec].push(t);
    }
  }
  return tests;
}

function explanationOf(S) {
  const he = S.method.filter((t) => HEB.test(t));
  const en = S.method.filter((t) => !HEB.test(t));
  return [
    `**הסבר קצר:** ${S.short[0]}`, `_${S.short[1]}_`,
    `**הסבר מלא:** ${S.full.join(" ")}`,
    ...he, en.length ? `_${en.join(" ")}_` : null,
    `**טעויות נפוצות**`,
    ...S.mistakes.flatMap((m) => [`✗ ${m.form} — ${m.he}`, m.en ? `_${m.en}_` : null]),
    S.summaryEn.length ? `_${S.summaryEn.join(" ")}_` : null,
    `**✓ תשובה סופית:** ${S.final.join(" / ")}`,
    S.final.length < S.accepted.length ? `**מתקבל גם:** ${S.accepted.filter((f) => !S.final.includes(f)).join(" / ")}` : null,
    S.vocab ? `**מילים לשינון:** ${S.vocab}` : null,
  ].filter(Boolean).join("\n\n");
}

function main() {
  const tests = read(docx);
  const index = indexDocx ? readOwnerIndex(indexDocx) : null;
  const errors = [];
  const items = [];
  for (const [tn, T] of [...tests].sort((a, b) => a[0] - b[0])) {
    if (T.size !== 4) errors.push(`T${tn}: ${T.size} questions (want 4)`);
    for (const [qn, it] of [...T].sort((a, b) => a[0] - b[0])) {
      const at = `T${tn}Q${qn}`;
      const S = it.sol;
      const blanks = (it.sentence.match(BLANK) ?? []).length;
      if (blanks !== 1) { errors.push(`${at}: ${blanks} blanks in the sentence`); continue; }
      if (!it.base || !LETTERS.test(it.base)) errors.push(`${at}: base word "${it.base}" is not one word`);
      if (!it.key?.length) { errors.push(`${at}: no answer-key row`); continue; }
      if (!S) { errors.push(`${at}: no solution block`); continue; }
      if (S.sentence !== it.sentence) errors.push(`${at}: solution sentence differs from the test sentence`);
      if (S.base !== it.base) errors.push(`${at}: solution base word "${S.base}" ≠ "${it.base}"`);
      // Where several forms are right, the key lists them all and "תשובה סופית" names the main one.
      if (!S.final?.length || S.final.some((f) => !it.key.includes(f))) errors.push(`${at}: "תשובה סופית" ${S.final} is not in the key ${it.key}`);
      if (S.short.length !== 2) errors.push(`${at}: הסבר קצר has ${S.short.length} lines (want he + en)`);
      if (!S.full.length) errors.push(`${at}: empty הסבר מלא`);
      if (!S.method.length) errors.push(`${at}: no 💡 שיטה line`);
      if (S.mistakes.length < 2) errors.push(`${at}: ${S.mistakes.length} ✗ mistakes (want at least 2)`);
      if (S.summaryEn.some((x) => HEB.test(x))) errors.push(`${at}: Hebrew text landed in the English summary`);
      const opensSentence = /^_{4,}/.test(it.sentence);
      for (const f of it.key) {
        if (!LETTERS.test(f)) errors.push(`${at}: accepted form "${f}" is not letters only`);
        if (f.toLowerCase() === it.base?.toLowerCase()) errors.push(`${at}: accepted form "${f}" is the base word itself`);
        const capital = f[0] === f[0].toUpperCase();
        if (capital !== opensSentence) errors.push(`${at}: "${f}" ${capital ? "is" : "is not"} capitalized but the blank ${opensSentence ? "opens" : "does not open"} the sentence`);
      }
      for (const m of S.mistakes) if (it.key.includes(m.form)) errors.push(`${at}: "${m.form}" is listed both as accepted and as a mistake`);
      const ix = index?.get(`${tn}:${qn}`);
      if (index) {
        if (!ix) errors.push(`${at}: no row in the index`);
        else {
          if (!(ix.level in LEVEL)) errors.push(`${at}: unknown level "${ix.level}"`);
          if (!it.key.includes(ix.answer)) errors.push(`${at}: index answer "${ix.answer}" is not in the key (${it.key.join(" / ")})`);
          if (!/^WF-M\d$/.test(ix.primary) || !ix.methods.includes(ix.primary)) errors.push(`${at}: bad method "${ix.primary}" / "${ix.methods.join(", ")}"`);
          if (ix.status !== "owner_approved" && !(acceptPending && PENDING_STATUSES.includes(ix.status))) {
            errors.push(`${at}: status "${ix.status}" (pass --accept-pending-review to publish it)`);
          }
        }
      }
      if (errors.some((e) => e.startsWith(`${at}:`))) continue;
      items.push({
        id: `wf-t${String(tn).padStart(2, "0")}-q${qn}`,
        test: tn,
        n: qn,
        sentence: it.sentence.replace(BLANK, "________"),
        baseWord: it.base,
        accepted: it.key,
        mistakes: Object.fromEntries(S.mistakes.map((m) => [m.form, m.he + (m.en ? `\n\n_${m.en}_` : "")])),
        explanation: explanationOf({ ...S, accepted: it.key }),
        ...(ix && {
          ownerId: ix.id,
          level: LEVEL[ix.level],
          l6Top: ix.level === "L6 top",
          methods: ix.methods,
          theme: ix.theme,
          status: ix.status,
        }),
      });
    }
  }
  if (errors.length) {
    console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} — nothing written:\n`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  // Stable ids: an unchanged question keeps the id it was published under.
  const published = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
  const fp = (x) => `${x.sentence}\u0000${x.baseWord}`;
  const byText = new Map(published.map((x) => [fp(x), x.id]));
  const takenByOthers = new Set(published.map((x) => x.id));
  const used = new Set();
  for (const x of items) {
    const kept = byText.get(fp(x));
    if (kept) { x.id = kept; used.add(kept); }
  }
  for (const x of items) {
    if (byText.get(fp(x)) === x.id) continue;
    let id = x.id;
    for (let k = 2; used.has(id) || takenByOthers.has(id); k++) id = `${x.id}-${k}`;
    if (id !== x.id) console.log(`  id ${x.id} is a new question; published as ${id}`);
    x.id = id;
    used.add(id);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
  const several = items.filter((x) => x.accepted.length > 1).length;
  const capital = items.filter((x) => /^_{4,}/.test(x.sentence)).length;
  console.log(`Validated ${items.length} items across ${tests.size} tests (${several} with several accepted forms, ${capital} opening the sentence) → ${path.relative(root, OUT)}`);
}

main();
