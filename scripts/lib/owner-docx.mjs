/**
 * Shared reader for the content owner's Word deliveries (restatement sets,
 * reading passages). Each delivery is a pair:
 *
 *   - the units document: "<unit> N" headings (מקבץ / קטע), each with numbered
 *     stems and (1)–(4) options — for reading, a title and numbered paragraphs
 *     come first — then "<unit> N – מפתח תשובות" and "<unit> N – פתרונות מלאים"
 *     with one fixed block per question: הסבר קצר (he + en), הסבר מלא,
 *     💡 שיטה (he + en), למה לא האפשרויות האחרות (three ✗, each he + en),
 *     an English summary, ✓ תשובה סופית, and optionally מילים לשינון.
 *   - the owner index: one row per question — unit, number, stable id, level
 *     (L1–L6, "L6 top"), primary + secondary methods, theme, the correct
 *     answer text, difficulty, status.
 *
 * Nothing here decides what is valid; the ingest scripts do. This only reads.
 */
import { execFileSync } from "node:child_process";

export const LEVEL = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5, L6: 6, "L6 top": 6 };
export const OPTION_IDS = ["a", "b", "c", "d"];
export const HEB = /[֐-׿]/;
/** An explanation that names an answer by its letter or number breaks once options are shuffled. */
export const LETTER_REF = /\(\s*[A-Da-d1-4]\s*\)|אפשרות [1-4א-ד](?![֐-׿])|תשובה [1-4א-ד](?![֐-׿])/;

/** Index statuses the owner uses before his own sign-off. */
export const PENDING_STATUSES = ["needs_owner_review", "qa_passed"];

/** Paragraphs of a .docx as [style, text], in document order. */
export function paragraphs(file) {
  const xml = execFileSync("unzip", ["-p", file, "word/document.xml"], { maxBuffer: 1 << 28 }).toString("utf8");
  const out = [];
  for (const p of xml.split("</w:p>")) {
    const style = (p.match(/<w:pStyle w:val="([^"]+)"/) ?? [])[1] ?? "";
    const text = [...p.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)]
      .map((m) => (m[0] === "<w:tab/>" ? "\t" : m[1]))
      .join("")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .trim();
    if (text) out.push([style, text]);
  }
  return out;
}

/** Owner index rows keyed "unit:question". */
export function readOwnerIndex(file) {
  const cells = paragraphs(file).map(([, t]) => t);
  const start = cells.indexOf("status") + 1;
  if (start === 0) throw new Error("index: header row with 'status' not found");
  const rows = new Map();
  for (let i = start; i + 9 < cells.length; i += 10) {
    const r = cells.slice(i, i + 10);
    const unit = Number(r[0].split(/\s+/).pop());
    const n = Number(r[1]);
    if (!Number.isInteger(unit) || !Number.isInteger(n)) throw new Error(`index: bad row at cell ${i}: ${r.join(" | ")}`);
    rows.set(`${unit}:${n}`, {
      id: r[2], level: r[3], primary: r[4],
      methods: r[5].split(",").map((m) => m.trim()).filter(Boolean),
      theme: r[6], answer: r[7], difficulty: Number(r[8]), status: r[9],
    });
  }
  return rows;
}

/**
 * Units of the document: Map(unit → { passage, questions }), where passage is
 * { title, paragraphs[] } when `withPassage`, and questions is Map(n → item).
 */
export function readOwnerUnits(file, { unitWord, withPassage = false }) {
  const units = new Map();
  let cur = null, mode = null, q = null, sec = null;
  const STEM = /^(\d+)\.\s+(.*)$/, OPT = /^\((\d)\)\s+(.*)$/;
  const unitHeading = new RegExp(`^${unitWord} (\\d+)$`);
  const english = (t) => /^[A-Za-z"'“‘(]/.test(t) && !HEB.test(t);
  for (const [style, t] of paragraphs(file)) {
    const h1 = style === "Heading1" && t.match(unitHeading);
    if (h1) {
      cur = Number(h1[1]);
      units.set(cur, { passage: withPassage ? { title: null, paragraphs: [] } : null, questions: new Map(), meta: [] });
      mode = "q"; q = null;
      continue;
    }
    if (style === "Heading1" && /מפתח תשובות/.test(t)) { mode = "key"; q = null; continue; }
    if (style === "Heading2" && /פתרונות מלאים/.test(t)) { mode = "sol"; q = null; continue; }
    if (style === "Heading2") { mode = null; continue; } // the "איך לתרגל" / "שיטות הפתרון" preamble
    if (cur == null || mode == null) continue;
    const U = units.get(cur);
    const Q = U.questions;
    if (mode === "q") {
      const ms = t.match(STEM);
      if (ms) { q = Number(ms[1]); Q.set(q, { n: q, stem: ms[2], options: [], key: null, sol: null }); continue; }
      const mo = t.match(OPT);
      if (mo && q) { Q.get(q).options.push(mo[2]); continue; }
      if (q == null && withPassage) {
        // Before the first stem: meta line, instruction, title, then "(N)  paragraph".
        if (mo) { U.passage.paragraphs.push({ n: Number(mo[1]), text: mo[2] }); continue; }
        if (HEB.test(t) || /^Read the passage/i.test(t)) { U.meta.push(t); continue; }
        if (U.passage.title == null) { U.passage.title = t; continue; }
        U.meta.push(t);
      }
      continue;
    }
    if (mode === "key") {
      if (/^\d+$/.test(t)) { q = Number(t); continue; }
      const mk = t.match(OPT);
      if (mk && q && Q.has(q)) Q.get(q).key = { pos: Number(mk[1]), text: mk[2] };
      continue;
    }
    if (mode === "sol") {
      const hq = t.match(/^שאלה (\d+)$/);
      if (hq) {
        q = Number(hq[1]);
        if (Q.has(q)) Q.get(q).sol = { stem: null, short: [], full: [], method: [], whyNot: [], summaryEn: [], final: null, vocab: null };
        sec = "head";
        continue;
      }
      const sol = q && Q.get(q)?.sol;
      if (!sol) continue;
      if (sec === "head") {
        // The block re-prints the stem and the four options before the explanations.
        if (t.match(OPT)) continue;
        if (t === "הסבר קצר") { sec = "short"; continue; }
        if (!sol.stem) sol.stem = t;
        continue;
      }
      if (t === "הסבר קצר") { sec = "short"; continue; }
      if (t === "הסבר מלא") { sec = "full"; continue; }
      if (t === "למה לא האפשרויות האחרות") { sec = "whyNot"; continue; }
      if (t.startsWith("✓ תשובה סופית")) { sol.final = t.split(":").slice(1).join(":").trim(); sec = "after"; continue; }
      if (t.startsWith("מילים לשינון")) { sol.vocab = t.split(":").slice(1).join(":").trim(); sec = "after"; continue; }
      if (sec === "after") continue;
      if (t.startsWith("💡 שיטה")) { sec = "method"; sol.method.push(t); continue; }
      if (sec === "method") { sol.method.push(t); continue; }
      if (sec === "whyNot") {
        if (t.startsWith("✗")) {
          // Short options carry their Hebrew explanation on the same line: "✗ fitting — האפשרות…".
          const body = t.replace(/^✗\s*/, "");
          const inline = body.match(/^(.*?)\s+—\s+(.*[֐-׿].*)$/);
          sol.whyNot.push(inline && !HEB.test(inline[1])
            ? { text: inline[1].trim(), he: inline[2].trim(), en: null }
            : { text: body, he: null, en: null });
        }
        else if (sol.whyNot.length && sol.whyNot.at(-1).he == null && HEB.test(t)) sol.whyNot.at(-1).he = t;
        else if (sol.whyNot.length && sol.whyNot.at(-1).en == null && english(t)) sol.whyNot.at(-1).en = t;
        else sol.summaryEn.push(t);
        continue;
      }
      if (sec === "short" || sec === "full") sol[sec].push(t);
    }
  }
  return units;
}

/**
 * Checks shared by every owner delivery. Returns a list of problems for one
 * question; empty means it can be built.
 */
export function checkOwnerItem({ at, it, ix, methods, acceptPending, requireVocab }) {
  const errors = [];
  const sol = it.sol;
  if (it.options.length !== 4) errors.push(`${at}: ${it.options.length} options`);
  if (!it.key) errors.push(`${at}: no answer-key row`);
  else if (it.options[it.key.pos - 1] !== it.key.text) errors.push(`${at}: key says (${it.key.pos}) but that option differs from the key text`);
  if (!ix) errors.push(`${at}: no index row`);
  else {
    if (it.key && ix.answer !== it.key.text) errors.push(`${at}: index answer ≠ key`);
    if (!(ix.level in LEVEL)) errors.push(`${at}: unknown level "${ix.level}"`);
    if (!(ix.primary in methods)) errors.push(`${at}: unknown method "${ix.primary}"`);
    for (const m of ix.methods) if (!(m in methods)) errors.push(`${at}: unknown secondary method "${m}"`);
    if (ix.status !== "owner_approved" && !(acceptPending && PENDING_STATUSES.includes(ix.status))) {
      errors.push(`${at}: status is "${ix.status}", not owner_approved`);
    }
  }
  if (!sol) { errors.push(`${at}: no solution block`); return errors; }
  if (sol.stem !== it.stem) errors.push(`${at}: solution stem differs from the question stem`);
  if (sol.short.length !== 2) errors.push(`${at}: הסבר קצר has ${sol.short.length} lines (want he + en)`);
  if (!sol.full.length) errors.push(`${at}: empty הסבר מלא`);
  if (!sol.method.length) errors.push(`${at}: no 💡 שיטה line`);
  if (sol.whyNot.length !== 3) errors.push(`${at}: ${sol.whyNot.length} ✗ paragraphs (want 3)`);
  if (it.key && sol.final !== it.key.text) errors.push(`${at}: "תשובה סופית" differs from the key`);
  if (requireVocab && !sol.vocab) errors.push(`${at}: no מילים לשינון line`);
  if (sol.summaryEn.some((t) => HEB.test(t))) errors.push(`${at}: Hebrew text landed in the English summary — the block layout changed`);
  return errors;
}

/**
 * The primary method, resolved against the 💡 line. Normally the two must
 * agree. With acceptPending, a pending row whose index disagrees takes the
 * solutions document's method (it is the text the learner reads).
 */
export function resolvePrimaryMethod({ at, ix, sol, methods, acceptPending, notes, errors }) {
  if (!ix || !(ix.primary in methods) || !sol?.method.length) return ix?.primary ?? null;
  if (sol.method[0].includes(methods[ix.primary])) return ix.primary;
  const fromDoc = Object.entries(methods).find(([, name]) => sol.method[0].includes(name))?.[0];
  if (acceptPending && PENDING_STATUSES.includes(ix.status) && fromDoc) {
    notes.push(`${at}: primary method taken from the solutions doc: ${fromDoc} (index said ${ix.primary})`);
    return fromDoc;
  }
  errors.push(`${at}: index says ${ix.primary} (${methods[ix.primary]}) but the 💡 line reads: ${sol.method[0].slice(0, 60)}`);
  return null;
}

/**
 * Explanation markdown, one paragraph per language: the renderer sets text
 * direction per paragraph, and a paragraph mixing an English sentence with its
 * Hebrew explanation reads scrambled.
 */
export function buildOwnerExplanation(sol) {
  const methodHe = sol.method.filter((t) => HEB.test(t));
  const methodEn = sol.method.filter((t) => !HEB.test(t));
  return [
    `**הסבר קצר:** ${sol.short[0]}`, `_${sol.short[1]}_`,
    `**הסבר מלא:** ${sol.full.join(" ")}`,
    ...methodHe, methodEn.length ? `_${methodEn.join(" ")}_` : null,
    `**למה לא האפשרויות האחרות**`,
    ...sol.whyNot.flatMap((w) => [`✗ ${w.text}`, w.he, w.en ? `_${w.en}_` : null]),
    sol.summaryEn.length ? `_${sol.summaryEn.join(" ")}_` : null,
    `**✓ תשובה סופית:**`,
    sol.final,
    sol.vocab ? `**מילים לשינון:** ${sol.vocab}` : null,
  ].filter(Boolean).join("\n\n");
}

/** Per-distractor explanations keyed by option id, or the reason they cannot be built. */
export function buildDistractorExplanations({ at, sol, options, correct }) {
  const out = {};
  const errors = [];
  for (const w of sol.whyNot) {
    const oid = options.find((o) => o.label === w.text)?.id;
    if (!oid) { errors.push(`${at}: ✗ paragraph names text that is not an option: "${w.text.slice(0, 50)}"`); continue; }
    if (!w.he) { errors.push(`${at}: ✗ for option ${oid} has no Hebrew explanation`); continue; }
    out[oid] = w.he + (w.en ? `\n\n_${w.en}_` : "");
  }
  const expected = OPTION_IDS.filter((id) => id !== correct).join("");
  if (!errors.length && Object.keys(out).sort().join("") !== expected) {
    errors.push(`${at}: distractor explanations cover [${Object.keys(out)}], want [${expected}]`);
  }
  return { distractorExplanations: out, errors };
}

/**
 * A question keeps the id it was published under for as long as its text is
 * unchanged. The owner's index ids encode the level and get renumbered when he
 * re-rates a unit; if bank ids followed them, a learner's past answers would
 * silently point at a different question (an id freed by one question can be
 * reissued to another). New questions take the index id; a clash with an id
 * already held by different text gets a numeric suffix.
 */
export function assignStableIds(items, publishedItems) {
  const fingerprint = (q) => JSON.stringify([q.questionText, q.options.map((o) => o.label).sort()]);
  const byText = new Map(publishedItems.map((q) => [fingerprint(q), q.questionId]));
  const taken = new Set();
  const notes = [];
  for (const q of items) {
    const kept = byText.get(fingerprint(q));
    if (kept) {
      if (kept !== q.questionId) notes.push(`${q.questionId} keeps its published id ${kept}`);
      q.questionId = kept;
      taken.add(kept);
    }
  }
  const publishedIds = new Set(publishedItems.map((q) => q.questionId));
  for (const q of items) {
    if (taken.has(q.questionId) && byText.get(fingerprint(q)) === q.questionId) continue;
    let id = q.questionId;
    for (let k = 2; taken.has(id) || (publishedIds.has(id) && byText.get(fingerprint(q)) !== id); k++) id = `${q.questionId}-${k}`;
    if (id !== q.questionId) notes.push(`${q.questionId} is a new question; its index id was already used, published as ${id}`);
    q.questionId = id;
    taken.add(id);
  }
  return notes;
}
