/**
 * Imports the content owner's restatement (ניסוח מחדש) sets from Word into the bank.
 *
 * Input is the document pair the owner produces per topic:
 *   - the sets document: "מקבץ N" → numbered stems + (1)–(4) full-sentence
 *     options, a "מקבץ N – מפתח תשובות" table, and "מקבץ N – פתרונות מלאים"
 *     with a fixed block per question (הסבר קצר he+en, הסבר מלא, 💡 שיטה he+en,
 *     למה לא האפשרויות האחרות ✗×3 each with he+en, an English summary,
 *     ✓ תשובה סופית, מילים לשינון)
 *   - the owner index: one row per question with the stable id (RS-L3-0012),
 *     level (L1–L6, "L6 top"), primary + secondary methods (RS-M1..M5), theme,
 *     the full correct sentence and status.
 *
 * Every item is cross-checked before anything is written: the answer-key table,
 * the index row and the correct option must name the same sentence; each
 * distractor must have its own ✗ paragraph naming an actual option; the 💡 line
 * must name the primary method the index claims. An optional JSON export
 * (--json <file>) is a fourth source checked for id, answer, options and level.
 * One failure aborts the run.
 *
 * Items are tagged `shuffle-safe`: explanations refer to answers by sentence,
 * never by number, which is also enforced here.
 *
 * Usage:
 *   npm run ingest:owner-rs -- <sets.docx> <index.docx> [--json <sets.json>]            # validate + write content/amirant-import/owner/rs-tests.json
 *   npm run ingest:owner-rs -- <sets.docx> <index.docx> [--json <sets.json>] --merge    # also merge into questions.json (replaces earlier owner-rs items) and regenerate the public bank
 *   add --accept-pending-review to take rows the index still marks needs_owner_review (see below)
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const BANK = path.join(root, "content/amirant-import/source/questions.json");
const OUT = path.join(root, "content/amirant-import/owner/rs-tests.json");

const args = process.argv.slice(2);
const MERGE = args.includes("--merge");
/**
 * By default every index row must be `owner_approved`, and the index's primary
 * method must match the 💡 line of the solution. `--accept-pending-review`
 * relaxes both for rows the index marks `needs_owner_review`: the row is
 * accepted, and where the two documents disagree on the primary method the
 * solutions document wins (it is the text the learner reads). Each relaxed row
 * is printed, and the item is tagged `owner-status:needs_owner_review` so it
 * can be found, or pulled, later. Use it only when the owner has said the
 * delivery is ready although the index was generated before his review.
 */
const ACCEPT_PENDING = args.includes("--accept-pending-review");
const jsonAt = args.indexOf("--json");
const jsonPath = jsonAt !== -1 ? args[jsonAt + 1] : null;
const positional = args.filter((a, i) => !a.startsWith("--") && !(jsonAt !== -1 && i === jsonAt + 1));
const [setsDocx, indexDocx] = positional;
if (!setsDocx || !indexDocx) {
  console.error("Usage: node scripts/ingest-owner-rs-tests.mjs <sets.docx> <index.docx> [--json <sets.json>] [--accept-pending-review] [--merge]");
  process.exit(2);
}

/** The five restatement methods, named as the sets document's legend spells them. */
const METHODS = {
  "RS-M1": "פירוק ליחידות משמעות",
  "RS-M2": "זיהוי הקשר הלוגי ומקבילותיו",
  "RS-M3": "סריקת מלכודות",
  "RS-M4": "שלילה וכמתים",
  "RS-M5": "מי עשה מה למי",
};
/** Weak-topic analytics bucket per primary method (the 9-way rephrasing taxonomy). */
const METHOD_SUBTOPIC = {
  "RS-M1": "rephrasing-paraphrase",
  "RS-M2": "rephrasing-cause-effect",
  "RS-M3": "rephrasing-paraphrase",
  "RS-M4": "rephrasing-negation",
  "RS-M5": "rephrasing-passive",
};
const LEVEL = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5, L6: 6, "L6 top": 6 };
const OPTION_IDS = ["a", "b", "c", "d"];
const LETTER_REF = /\(\s*[A-Da-d1-4]\s*\)|אפשרות [1-4א-ד](?![֐-׿])|תשובה [1-4א-ד](?![֐-׿])/;
const HEB = /[֐-׿]/;

/** Paragraphs of a .docx as [style, text], in document order. */
function paragraphs(file) {
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

function readIndex(file) {
  const cells = paragraphs(file).map(([, t]) => t);
  const start = cells.indexOf("status") + 1;
  if (start === 0) throw new Error("index: header row with 'status' not found");
  const rows = new Map();
  for (let i = start; i + 9 < cells.length; i += 10) {
    const r = cells.slice(i, i + 10);
    const set = Number(r[0].split(/\s+/).pop());
    const n = Number(r[1]);
    if (!Number.isInteger(set) || !Number.isInteger(n)) throw new Error(`index: bad row at cell ${i}: ${r.join(" | ")}`);
    rows.set(`${set}:${n}`, {
      id: r[2], level: r[3], primary: r[4],
      methods: r[5].split(",").map((m) => m.trim()).filter(Boolean),
      theme: r[6], answer: r[7], difficulty: Number(r[8]), status: r[9],
    });
  }
  return rows;
}

function readSets(file) {
  const sets = new Map();
  let cur = null, mode = null, q = null, sec = null;
  const STEM = /^(\d+)\.\s+(.*)$/, OPT = /^\((\d)\)\s+(.*)$/;
  const english = (t) => /^[A-Za-z"'“]/.test(t) && !HEB.test(t);
  for (const [style, t] of paragraphs(file)) {
    const h1 = style === "Heading1" && t.match(/^מקבץ (\d+)$/);
    if (h1) { cur = Number(h1[1]); sets.set(cur, new Map()); mode = "q"; q = null; continue; }
    if (style === "Heading1" && /מפתח תשובות/.test(t)) { mode = "key"; q = null; continue; }
    if (style === "Heading2" && /פתרונות מלאים/.test(t)) { mode = "sol"; q = null; continue; }
    if (style === "Heading2") { mode = null; continue; } // איך לתרגל / שיטות הפתרון preamble
    if (cur == null || mode == null) continue;
    const S = sets.get(cur);
    if (mode === "q") {
      const ms = t.match(STEM);
      if (ms) { q = Number(ms[1]); S.set(q, { n: q, stem: ms[2], options: [], key: null, sol: null }); continue; }
      const mo = t.match(OPT);
      if (mo && q) S.get(q).options.push(mo[2]);
      continue;
    }
    if (mode === "key") {
      if (/^\d+$/.test(t)) { q = Number(t); continue; }
      const mk = t.match(OPT);
      if (mk && q && S.has(q)) S.get(q).key = { pos: Number(mk[1]), sentence: mk[2] };
      continue;
    }
    if (mode === "sol") {
      const hq = t.match(/^שאלה (\d+)$/);
      if (hq) {
        q = Number(hq[1]);
        if (S.has(q)) S.get(q).sol = { stem: null, short: [], full: [], method: [], whyNot: [], summaryEn: [], final: null, vocab: null };
        sec = "head";
        continue;
      }
      const sol = q && S.get(q)?.sol;
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
        if (t.startsWith("✗")) sol.whyNot.push({ sentence: t.replace(/^✗\s*/, ""), he: null, en: null });
        else if (sol.whyNot.length && sol.whyNot.at(-1).he == null && HEB.test(t)) sol.whyNot.at(-1).he = t;
        else if (sol.whyNot.length < 3 && sol.whyNot.at(-1) && sol.whyNot.at(-1).en == null && english(t)) sol.whyNot.at(-1).en = t;
        else if (sol.whyNot.length === 3 && sol.whyNot.at(-1).en == null && english(t)) sol.whyNot.at(-1).en = t;
        else sol.summaryEn.push(t);
        continue;
      }
      if (sec === "short" || sec === "full") sol[sec].push(t);
    }
  }
  return sets;
}

function fail(msgs) {
  console.error(`\n${msgs.length} problem${msgs.length === 1 ? "" : "s"} — nothing written:\n`);
  for (const m of msgs) console.error(`  ${m}`);
  process.exit(1);
}

function main() {
  const index = readIndex(indexDocx);
  const sets = readSets(setsDocx);
  const exportJson = jsonPath ? JSON.parse(fs.readFileSync(jsonPath, "utf8")) : null;
  const exported = new Map();
  if (exportJson) {
    for (const s of exportJson.sets) for (const eq of s.questions) exported.set(`${s.set}:${eq.number}`, eq);
  }
  const errors = [];
  const items = [];

  for (const [sn, S] of [...sets].sort((a, b) => a[0] - b[0])) {
    for (const [qn, it] of [...S].sort((a, b) => a[0] - b[0])) {
      const at = `S${sn}Q${qn}`;
      const ix = index.get(`${sn}:${qn}`);
      const sol = it.sol;
      if (it.options.length !== 4) errors.push(`${at}: ${it.options.length} options`);
      if (!it.key) errors.push(`${at}: no answer-key row`);
      else if (it.options[it.key.pos - 1] !== it.key.sentence) errors.push(`${at}: key says (${it.key.pos}) but that option differs from the key sentence`);
      if (!ix) errors.push(`${at}: no index row`);
      else {
        if (it.key && ix.answer !== it.key.sentence) errors.push(`${at}: index answer ≠ key sentence`);
        if (!(ix.level in LEVEL)) errors.push(`${at}: unknown level "${ix.level}"`);
        if (!(ix.primary in METHODS)) errors.push(`${at}: unknown method "${ix.primary}"`);
        for (const m of ix.methods) if (!(m in METHODS)) errors.push(`${at}: unknown secondary method "${m}"`);
        if (ix.status !== "owner_approved" && !(ACCEPT_PENDING && ix.status === "needs_owner_review")) {
          errors.push(`${at}: status is "${ix.status}", not owner_approved`);
        }
      }
      if (!sol) { errors.push(`${at}: no solution block`); continue; }
      if (sol.stem !== it.stem) errors.push(`${at}: solution stem differs from the question stem`);
      if (sol.short.length !== 2) errors.push(`${at}: הסבר קצר has ${sol.short.length} lines (want he + en)`);
      if (!sol.full.length) errors.push(`${at}: empty הסבר מלא`);
      let primary = ix?.primary ?? null;
      if (!sol.method.length) errors.push(`${at}: no 💡 שיטה line`);
      else if (ix && ix.primary in METHODS && !sol.method[0].includes(METHODS[ix.primary])) {
        const fromDoc = Object.entries(METHODS).find(([, name]) => sol.method[0].includes(name))?.[0];
        if (ACCEPT_PENDING && ix.status === "needs_owner_review" && fromDoc) {
          console.log(`  note ${at}: primary method taken from the solutions doc: ${fromDoc} (index said ${ix.primary})`);
          primary = fromDoc;
        } else {
          errors.push(`${at}: index says ${ix.primary} (${METHODS[ix.primary]}) but the 💡 line reads: ${sol.method[0].slice(0, 60)}`);
        }
      }
      if (sol.whyNot.length !== 3) errors.push(`${at}: ${sol.whyNot.length} ✗ paragraphs (want 3)`);
      if (it.key && sol.final !== it.key.sentence) errors.push(`${at}: "תשובה סופית" differs from the key sentence`);
      if (!sol.vocab) errors.push(`${at}: no מילים לשינון line`);
      if (sol.summaryEn.some((t) => HEB.test(t))) errors.push(`${at}: Hebrew text landed in the English summary — the block layout changed`);
      const ex = exported.get(`${sn}:${qn}`);
      if (exportJson && !ex) errors.push(`${at}: missing from the JSON export`);
      if (ex) {
        if (ix && ex.id !== ix.id) errors.push(`${at}: JSON id ${ex.id} ≠ index id ${ix.id}`);
        if (ex.stem !== it.stem) errors.push(`${at}: JSON stem differs`);
        if (it.key && ex.answerIndex !== it.key.pos - 1) errors.push(`${at}: JSON answerIndex ${ex.answerIndex} ≠ key position ${it.key.pos - 1}`);
        if (JSON.stringify(ex.options) !== JSON.stringify(it.options)) errors.push(`${at}: JSON options differ`);
        if (ix && ex.level !== ix.level) errors.push(`${at}: JSON level ${ex.level} ≠ index ${ix.level}`);
      }
      if (errors.length) continue;

      const correct = OPTION_IDS[it.key.pos - 1];
      const options = it.options.map((label, i) => ({ id: OPTION_IDS[i], label }));
      const distractorExplanations = {};
      for (const w of sol.whyNot) {
        const oid = options.find((o) => o.label === w.sentence)?.id;
        if (!oid) { errors.push(`${at}: ✗ paragraph names a sentence that is not an option: "${w.sentence.slice(0, 50)}"`); continue; }
        if (!w.he) { errors.push(`${at}: ✗ for option ${oid} has no Hebrew explanation`); continue; }
        distractorExplanations[oid] = w.he + (w.en ? `\n\n_${w.en}_` : "");
      }
      const expected = OPTION_IDS.filter((id) => id !== correct).join("");
      if (Object.keys(distractorExplanations).sort().join("") !== expected) {
        errors.push(`${at}: distractor explanations cover [${Object.keys(distractorExplanations)}], want [${expected}]`);
        continue;
      }

      const methodHe = sol.method.filter((t) => HEB.test(t));
      const methodEn = sol.method.filter((t) => !HEB.test(t));
      // One paragraph per language: the renderer sets direction per paragraph, and
      // a list item mixing an English sentence with its Hebrew explanation reads
      // scrambled. So each ✗ is three short paragraphs, not one bullet.
      const explanation = [
        `**הסבר קצר:** ${sol.short[0]}`, `_${sol.short[1]}_`,
        `**הסבר מלא:** ${sol.full.join(" ")}`,
        ...methodHe, methodEn.length ? `_${methodEn.join(" ")}_` : null,
        `**למה לא האפשרויות האחרות**`,
        ...sol.whyNot.flatMap((w) => [`✗ ${w.sentence}`, w.he, w.en ? `_${w.en}_` : null]),
        sol.summaryEn.length ? `_${sol.summaryEn.join(" ")}_` : null,
        `**✓ תשובה סופית:**`,
        sol.final,
        `**מילים לשינון:** ${sol.vocab}`,
      ].filter(Boolean).join("\n\n");

      if (LETTER_REF.test(explanation + Object.values(distractorExplanations).join(" "))) {
        errors.push(`${at}: explanation refers to an answer by letter/number — not shuffle-safe`);
        continue;
      }

      const level = LEVEL[ix.level];
      items.push({
        questionId: ix.id.toLowerCase(),
        topic: "rephrasing",
        subtopic: METHOD_SUBTOPIC[primary],
        difficultyLevel: level,
        questionText: `Original: ${it.stem}`,
        options,
        correctOptionId: correct,
        explanation,
        distractorExplanations,
        estimatedTimeSec: 120,
        tags: [
          "owner_rs", "shuffle-safe", `owner-rs-set-${sn}`, "quiz", `difficulty_${level}`,
          `method:${primary}`, ...ix.methods.filter((m) => m !== primary).map((m) => `method:${m}`),
          `theme:${ix.theme}`, ...(ix.level === "L6 top" ? ["l6-top"] : []),
          ...(ix.status === "owner_approved" ? [] : [`owner-status:${ix.status}`]),
        ],
      });
    }
  }

  if (errors.length) fail(errors);
  const ids = items.map((q) => q.questionId);
  if (new Set(ids).size !== ids.length) fail(["duplicate question ids in the index"]);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
  const perSet = [...sets.keys()].map((s) => `${s}:${items.filter((q) => q.tags.includes(`owner-rs-set-${s}`)).length}`).join(" ");
  console.log(`Validated ${items.length} items across ${sets.size} sets (${perSet}) → ${path.relative(root, OUT)}`);

  if (!MERGE) return;
  const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
  const owned = new Set(ids);
  const kept = bank.filter((q) => !owned.has(q.questionId) && !(q.tags ?? []).includes("owner_rs"));
  const replaced = bank.length - kept.length;
  fs.writeFileSync(BANK, `${JSON.stringify([...kept, ...items], null, 2)}\n`);
  console.log(`Merged into questions.json: ${bank.length} → ${kept.length + items.length} (${replaced} earlier owner items replaced).`);
  execFileSync("node", [path.join(root, "scripts/generate-questions-public.mjs")], { stdio: "inherit" });
  console.log("Next: npm run qa:amirant-content && npm run generate:course-manifest");
}

main();
