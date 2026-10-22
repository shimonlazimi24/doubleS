/**
 * Imports the content owner's restatement (ניסוח מחדש) sets from Word into the bank.
 *
 * Input: the sets document ("מקבץ N", 4 questions each) and the owner index —
 * see scripts/lib/owner-docx.mjs for the format. Optionally the JSON export
 * (--json <file>) as a fourth source, checked for id, stem, answer, options, level.
 *
 * Every item is cross-checked before anything is written: answer-key table,
 * index answer, "✓ תשובה סופית" and the option text must agree; each distractor
 * needs its own ✗ block naming a real option; the 💡 line must name the index's
 * primary method. One failure aborts the run.
 *
 * Items are tagged `shuffle-safe` (explanations name answers by sentence, never
 * by number — enforced here). A question keeps its published id while its text
 * is unchanged, even when the owner renumbers the index (see assignStableIds).
 *
 * Usage:
 *   npm run ingest:owner-rs -- <sets.docx> <index.docx> [--json <sets.json>]            # validate + write content/amirant-import/owner/rs-tests.json
 *   npm run ingest:owner-rs -- <sets.docx> <index.docx> [--json <sets.json>] --merge    # also merge into questions.json and regenerate the public bank
 *
 * --accept-pending-review takes rows the index still marks needs_owner_review or
 * qa_passed, for a delivery the owner has said is ready although the index was
 * generated before his sign-off. Where the index's primary method disagrees with
 * the 💡 line, the solutions document wins. Each such row is printed and the item
 * is tagged `owner-status:<status>`, so it can be found or pulled later.
 */
import fs from "node:fs";
import path from "node:path";
import {
  LEVEL, OPTION_IDS, LETTER_REF,
  readOwnerIndex, readOwnerUnits, checkOwnerItem, resolvePrimaryMethod,
  buildOwnerExplanation, buildDistractorExplanations, assignStableIds,
} from "./lib/owner-docx.mjs";

const root = process.cwd();
const BANK = path.join(root, "content/amirant-import/source/questions.json");
const OUT = path.join(root, "content/amirant-import/owner/rs-tests.json");
const TAG = "owner_rs";

const args = process.argv.slice(2);
const MERGE = args.includes("--merge");
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

function fail(msgs) {
  console.error(`\n${msgs.length} problem${msgs.length === 1 ? "" : "s"} — nothing written:\n`);
  for (const m of msgs) console.error(`  ${m}`);
  process.exit(1);
}

function main() {
  const index = readOwnerIndex(indexDocx);
  const sets = readOwnerUnits(setsDocx, { unitWord: "מקבץ" });
  const exported = new Map();
  if (jsonPath) {
    for (const s of JSON.parse(fs.readFileSync(jsonPath, "utf8")).sets) {
      for (const eq of s.questions) exported.set(`${s.set}:${eq.number}`, eq);
    }
  }
  const errors = [];
  const notes = [];
  const items = [];

  for (const [sn, S] of [...sets].sort((a, b) => a[0] - b[0])) {
    for (const [qn, it] of [...S.questions].sort((a, b) => a[0] - b[0])) {
      const at = `S${sn}Q${qn}`;
      const ix = index.get(`${sn}:${qn}`);
      const sol = it.sol;
      const before = errors.length;
      errors.push(...checkOwnerItem({ at, it, ix, methods: METHODS, acceptPending: ACCEPT_PENDING, requireVocab: true }));
      const primary = resolvePrimaryMethod({ at, ix, sol, methods: METHODS, acceptPending: ACCEPT_PENDING, notes, errors });
      const ex = exported.get(`${sn}:${qn}`);
      if (jsonPath && !ex) errors.push(`${at}: missing from the JSON export`);
      if (ex) {
        if (ix && ex.id !== ix.id) errors.push(`${at}: JSON id ${ex.id} ≠ index id ${ix.id}`);
        if (ex.stem !== it.stem) errors.push(`${at}: JSON stem differs`);
        if (it.key && ex.answerIndex !== it.key.pos - 1) errors.push(`${at}: JSON answerIndex ${ex.answerIndex} ≠ key position ${it.key.pos - 1}`);
        if (JSON.stringify(ex.options) !== JSON.stringify(it.options)) errors.push(`${at}: JSON options differ`);
        if (ix && ex.level !== ix.level) errors.push(`${at}: JSON level ${ex.level} ≠ index ${ix.level}`);
      }
      if (errors.length > before) continue;

      const correct = OPTION_IDS[it.key.pos - 1];
      const options = it.options.map((label, i) => ({ id: OPTION_IDS[i], label }));
      const dx = buildDistractorExplanations({ at, sol, options, correct });
      if (dx.errors.length) { errors.push(...dx.errors); continue; }
      const explanation = buildOwnerExplanation(sol);
      if (LETTER_REF.test(explanation + Object.values(dx.distractorExplanations).join(" "))) {
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
        distractorExplanations: dx.distractorExplanations,
        estimatedTimeSec: 120,
        tags: [
          TAG, "shuffle-safe", `owner-rs-set-${sn}`, "quiz", `difficulty_${level}`,
          `method:${primary}`, ...ix.methods.filter((m) => m !== primary).map((m) => `method:${m}`),
          `theme:${ix.theme}`, ...(ix.level === "L6 top" ? ["l6-top"] : []),
          ...(ix.status === "owner_approved" ? [] : [`owner-status:${ix.status}`]),
        ],
      });
    }
  }

  if (errors.length) fail(errors);
  for (const n of notes) console.log(`  note ${n}`);

  const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
  for (const n of assignStableIds(items, bank.filter((q) => (q.tags ?? []).includes(TAG)))) console.log(`  id ${n}`);
  const ids = items.map((q) => q.questionId);
  if (new Set(ids).size !== ids.length) fail(["duplicate question ids after id assignment"]);
  const foreign = bank.filter((q) => ids.includes(q.questionId) && !(q.tags ?? []).includes(TAG));
  if (foreign.length) fail(foreign.map((q) => `${q.questionId} is already used by a non-owner question`));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(items, null, 2)}\n`);
  const perSet = [...sets.keys()].map((s) => `${s}:${items.filter((q) => q.tags.includes(`owner-rs-set-${s}`)).length}`).join(" ");
  console.log(`Validated ${items.length} items across ${sets.size} sets (${perSet}) → ${path.relative(root, OUT)}`);

  if (!MERGE) return;
  const kept = bank.filter((q) => !(q.tags ?? []).includes(TAG));
  fs.writeFileSync(BANK, `${JSON.stringify([...kept, ...items], null, 2)}\n`);
  console.log(`Merged into questions.json: ${bank.length} → ${kept.length + items.length} (${bank.length - kept.length} earlier owner items replaced).`);
  console.log("Next: npm run qa:amirant-content && npm run generate:course-manifest");
}

main();
