/**
 * Imports the content owner's sentence-completion tests from Word into the bank.
 *
 * Input is the pair of documents the owner produces per topic:
 *   - the tests document: "מבחן N" → stems + (1)–(4) options, an answer-key
 *     table, and "פתרונות מלאים" with a fixed block per question (הסבר קצר
 *     he+en, הסבר מלא, 💡 שיטה, למה לא האפשרויות האחרות ✗×3, ✓ תשובה סופית,
 *     מילים לשינון)
 *   - the owner index: one row per question with the stable id (SC-L3-0003),
 *     level (L1–L6, "L6 top"), primary + secondary methods (SC-M1..M7), theme,
 *     answer word and status.
 *
 * Every item is cross-checked three ways before anything is written: the
 * answer-key table, the index row and the "תשובה סופית" line must name the same
 * option. The 💡 line must name the primary method the index claims. Each
 * distractor must have its own ✗ paragraph. One failure aborts the run.
 *
 * Items are tagged `shuffle-safe`: the owner's explanations name answers by
 * word, never by letter, so the UI may show the options in any order. That is
 * enforced here with a letter-reference check, and again by
 * `display-order.test.ts` over the whole bank.
 *
 * Usage:
 *   node scripts/ingest-owner-sc-tests.mjs <tests.docx> <index.docx>            # validate + write content/amirant-import/owner/sc-tests.json
 *   node scripts/ingest-owner-sc-tests.mjs <tests.docx> <index.docx> --merge    # also merge into questions.json (replaces earlier owner-sc items by id) and regenerate the public bank
 *
 * Needs `unzip` on PATH (macOS and CI both have it).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const BANK = path.join(root, "content/amirant-import/source/questions.json");
const OUT = path.join(root, "content/amirant-import/owner/sc-tests.json");

const [testsDocx, indexDocx] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const MERGE = process.argv.includes("--merge");
if (!testsDocx || !indexDocx) {
  console.error("Usage: node scripts/ingest-owner-sc-tests.mjs <tests.docx> <index.docx> [--merge]");
  process.exit(2);
}

/** The seven methods, in the order the tests document lists them. */
const METHODS = {
  "SC-M1": "לנחש לפני שמסתכלים על האפשרויות",
  "SC-M2": "מילות סימן וכיוון",
  "SC-M3": "רמז הגדרה/הסבר",
  "SC-M4": "רמז דוגמה",
  "SC-M5": "צירופים קבועים",
  "SC-M6": "פירוק מילה לחלקים",
  "SC-M7": "הצבה וקריאה חוזרת",
};
const LEVEL = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5, L6: 6, "L6 top": 6 };
const OPTION_IDS = ["a", "b", "c", "d"];
const LETTER_REF = /\(\s*[A-Da-d1-4]\s*\)|אפשרות [1-4א-ד](?![֐-׿])|תשובה [1-4א-ד](?![֐-׿])/;

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
    const test = Number(r[0].split(/\s+/).pop());
    const n = Number(r[1]);
    if (!Number.isInteger(test) || !Number.isInteger(n)) throw new Error(`index: bad row at cell ${i}: ${r.join(" | ")}`);
    rows.set(`${test}:${n}`, {
      id: r[2], level: r[3], primary: r[4],
      methods: r[5].split(",").map((m) => m.trim()).filter(Boolean),
      theme: r[6], answer: r[7], difficulty: Number(r[8]), status: r[9],
    });
  }
  return rows;
}

function readTests(file) {
  const tests = new Map();
  let cur = null, mode = null, q = null, sec = null;
  const STEM = /^(\d+)\.\s+(.*)$/, OPT = /^\((\d)\)\s+(.*)$/;
  for (const [style, t] of paragraphs(file)) {
    const h = t.match(/^מבחן (\d+)$/);
    if (style === "Heading1" && h) { cur = Number(h[1]); tests.set(cur, new Map()); mode = "q"; continue; }
    if (style === "Heading1" && t.includes("מפתח תשובות")) { mode = "key"; continue; }
    if (style === "Heading2" && t.includes("פתרונות מלאים")) { mode = "sol"; q = null; continue; }
    if (cur == null) continue;
    const T = tests.get(cur);
    if (mode === "q") {
      const ms = t.match(STEM);
      if (ms) { q = Number(ms[1]); T.set(q, { n: q, stem: ms[2], options: [], key: null, sol: null }); continue; }
      const mo = t.match(OPT);
      if (mo && q) T.get(q).options.push(mo[2]);
      continue;
    }
    if (mode === "key") {
      if (/^\d+$/.test(t)) { q = Number(t); continue; }
      const mk = t.match(OPT);
      if (mk && q && T.has(q)) T.get(q).key = { pos: Number(mk[1]), word: mk[2] };
      continue;
    }
    if (mode === "sol") {
      const hit = [...T.values()].find((it) => it.stem === t);
      if (hit) { q = hit.n; hit.sol = { short: [], full: [], method: [], whyNot: [], summaryEn: [], final: null, vocab: null }; sec = null; continue; }
      const S = q && T.get(q)?.sol;
      if (!S) continue;
      if (/^\(1\) .*·/.test(t)) continue;
      if (t === "הסבר קצר") { sec = "short"; continue; }
      if (t === "הסבר מלא") { sec = "full"; continue; }
      if (t === "למה לא האפשרויות האחרות") { sec = "whyNot"; continue; }
      if (t.startsWith("💡 שיטה")) { sec = "method"; S.method.push(t); continue; }
      if (t.startsWith("✓ תשובה סופית")) { S.final = t.split(":").slice(1).join(":").trim(); sec = "after"; continue; }
      if (t.startsWith("מילים לשינון")) { S.vocab = t.split(":").slice(1).join(":").trim(); continue; }
      if (sec === "method" && !t.startsWith("✗")) { S.method.push(t); continue; }
      if (sec === "whyNot") {
        if (t.startsWith("✗")) S.whyNot.push([t]);
        else if (/^[A-Z]/.test(t) && !/[֐-׿]/.test(t) && S.whyNot.at(-1)?.length === 1) S.whyNot.at(-1).push(t);
        else S.summaryEn.push(t);
        continue;
      }
      if (sec === "short" || sec === "full") S[sec].push(t);
    }
  }
  return tests;
}

function fail(msgs) {
  console.error(`\n${msgs.length} problem${msgs.length === 1 ? "" : "s"} — nothing written:\n`);
  for (const m of msgs) console.error(`  ${m}`);
  process.exit(1);
}

function main() {
  const index = readIndex(indexDocx);
  const tests = readTests(testsDocx);
  const errors = [];
  const items = [];

  for (const [tn, T] of [...tests].sort((a, b) => a[0] - b[0])) {
    for (const [qn, it] of [...T].sort((a, b) => a[0] - b[0])) {
      const at = `T${tn}Q${qn}`;
      const ix = index.get(`${tn}:${qn}`);
      const s = it.sol;
      if (it.options.length !== 4) errors.push(`${at}: ${it.options.length} options`);
      if (!it.key) errors.push(`${at}: no answer-key row`);
      else if (it.options[it.key.pos - 1] !== it.key.word) errors.push(`${at}: key says (${it.key.pos}) but that option is "${it.options[it.key.pos - 1]}", not "${it.key.word}"`);
      if (!ix) errors.push(`${at}: no index row`);
      else {
        if (it.key && ix.answer !== it.key.word) errors.push(`${at}: index answer "${ix.answer}" ≠ key "${it.key.word}"`);
        if (!(ix.level in LEVEL)) errors.push(`${at}: unknown level "${ix.level}"`);
        if (!(ix.primary in METHODS)) errors.push(`${at}: unknown method "${ix.primary}"`);
        if (ix.status !== "owner_approved") errors.push(`${at}: status is "${ix.status}", not owner_approved`);
      }
      if (!s) { errors.push(`${at}: no solution block`); continue; }
      if (it.key && s.final !== it.key.word) errors.push(`${at}: "תשובה סופית: ${s.final}" ≠ key "${it.key.word}"`);
      if (s.short.length !== 2) errors.push(`${at}: הסבר קצר has ${s.short.length} lines (want he + en)`);
      if (!s.full.length) errors.push(`${at}: empty הסבר מלא`);
      if (!s.method.length) errors.push(`${at}: no 💡 שיטה line`);
      else if (ix && ix.primary in METHODS && !s.method[0].includes(METHODS[ix.primary].split("/")[0])) {
        errors.push(`${at}: index says ${ix.primary} (${METHODS[ix.primary]}) but the 💡 line reads: ${s.method[0].slice(0, 60)}`);
      }
      if (s.whyNot.length !== 3) errors.push(`${at}: ${s.whyNot.length} ✗ paragraphs (want 3)`);
      if (!it.stem.includes("________")) errors.push(`${at}: stem has no blank`);
      if (errors.length) continue;

      const correct = OPTION_IDS[it.key.pos - 1];
      const options = it.options.map((label, i) => ({ id: OPTION_IDS[i], label }));
      const distractorExplanations = {};
      for (const [he, en] of s.whyNot) {
        const word = (he.match(/^✗\s*([^֐-׿(—–:]+?)\s*(?=[֐-׿(—–:])/) ?? [])[1]?.trim();
        const oid = options.find((o) => o.label === word)?.id;
        if (!oid) { errors.push(`${at}: ✗ paragraph names "${word}", which is not an option`); continue; }
        distractorExplanations[oid] = he.replace(/^✗\s*/, "") + (en ? `\n\n${en}` : "");
      }
      const expected = OPTION_IDS.filter((id) => id !== correct).join("");
      if (Object.keys(distractorExplanations).sort().join("") !== expected) errors.push(`${at}: distractor explanations cover [${Object.keys(distractorExplanations)}], want [${expected}]`);

      const explanation = [
        `**הסבר קצר:** ${s.short[0]}`, `_${s.short[1]}_`,
        `**הסבר מלא:** ${s.full.join(" ")}`,
        s.method[0], s.method[1] ? `_${s.method[1]}_` : null,
        `**למה לא האפשרויות האחרות**\n${s.whyNot.map(([he, en]) => `- ${he}${en ? `\n  _${en}_` : ""}`).join("\n")}`,
        s.summaryEn.length ? `_${s.summaryEn.join(" ")}_` : null,
        `**✓ תשובה סופית: ${s.final}**`,
        s.vocab ? `**מילים לשינון:** ${s.vocab}` : null,
      ].filter(Boolean).join("\n\n");

      if (LETTER_REF.test(explanation + Object.values(distractorExplanations).join(" "))) errors.push(`${at}: explanation refers to an answer by letter/number — not shuffle-safe`);

      const level = LEVEL[ix.level];
      items.push({
        questionId: ix.id.toLowerCase(),
        topic: "sentence_completion",
        subtopic: "sentence_completion-vocabulary-in-context",
        difficultyLevel: level,
        questionText: it.stem.replace(/_{6,}/g, "______"),
        options,
        correctOptionId: correct,
        explanation,
        distractorExplanations,
        estimatedTimeSec: 60,
        tags: [
          "owner_sc", "shuffle-safe", `owner-sc-test-${tn}`, "quiz", `difficulty_${level}`,
          `method:${ix.primary}`, ...ix.methods.filter((m) => m !== ix.primary).map((m) => `method:${m}`),
          `theme:${ix.theme}`, ...(ix.level === "L6 top" ? ["l6-top"] : []),
        ],
      });
    }
  }

  if (errors.length) fail(errors);
  const ids = items.map((q) => q.questionId);
  if (new Set(ids).size !== ids.length) fail(["duplicate question ids in the index"]);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
  const perTest = [...tests.keys()].map((t) => `${t}:${items.filter((q) => q.tags.includes(`owner-sc-test-${t}`)).length}`).join(" ");
  console.log(`Validated ${items.length} items across ${tests.size} tests (${perTest}) → ${path.relative(root, OUT)}`);

  if (!MERGE) return;
  const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
  const owned = new Set(ids);
  const kept = bank.filter((q) => !owned.has(q.questionId) && !(q.tags ?? []).includes("owner_sc"));
  const replaced = bank.length - kept.length;
  fs.writeFileSync(BANK, `${JSON.stringify([...kept, ...items], null, 2)}\n`);
  console.log(`Merged into questions.json: ${bank.length} → ${kept.length + items.length} (${replaced} earlier owner items replaced).`);
  execFileSync("node", [path.join(root, "scripts/generate-questions-public.mjs")], { stdio: "inherit" });
  console.log("Next: npm run qa:amirant-content && npm run generate:course-manifest");
}

main();
