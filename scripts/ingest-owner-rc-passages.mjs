/**
 * Imports the content owner's reading-comprehension passages from Word into the bank.
 *
 * Input: the passages document ("קטע N": title, numbered paragraphs, then 5–6
 * questions) and the owner index (ids like RC-L2-0001/q1) — see
 * scripts/lib/owner-docx.mjs for the shared block format.
 *
 * On top of the shared checks (key ↔ index ↔ "✓ תשובה סופית", one ✗ block per
 * distractor, 💡 method ↔ index), each passage must have a title and paragraphs
 * numbered 1..k without gaps, and every "paragraph N" a question mentions must
 * exist in its passage. One failure aborts the run.
 *
 * Writes the questions (tag owner_rc, owner-rc-passage-N, shuffle-safe) and the
 * passages (sourceTag owner_rc). With --merge both go into the bank:
 * questions.json and passages.json, replacing earlier owner_rc entries.
 *
 * Usage:
 *   npm run ingest:owner-rc -- <passages.docx> <index.docx> [--accept-pending-review] [--merge]
 *
 * --accept-pending-review: as in ingest-owner-rs-tests.mjs.
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
const PASSAGES = path.join(root, "content/amirant-import/source/passages.json");
const OUT_Q = path.join(root, "content/amirant-import/owner/rc-tests.json");
const OUT_P = path.join(root, "content/amirant-import/owner/rc-passages.json");
const TAG = "owner_rc";

const args = process.argv.slice(2);
const MERGE = args.includes("--merge");
const ACCEPT_PENDING = args.includes("--accept-pending-review");
const [docx, indexDocx] = args.filter((a) => !a.startsWith("--"));
if (!docx || !indexDocx) {
  console.error("Usage: node scripts/ingest-owner-rc-passages.mjs <passages.docx> <index.docx> [--accept-pending-review] [--merge]");
  process.exit(2);
}

/** The five reading methods, named as the document's legend spells them. */
const METHODS = {
  "RC-M1": "משפט נושא לכל פסקה",
  "RC-M2": "איתור לפי מילת מפתח",
  "RC-M3": "החלפת המילה בהקשר",
  "RC-M4": "\"כתוב בטקסט?\"",
  "RC-M5": "הסקה = צעד אחד",
};
/** Weak-topic analytics bucket per primary method (the existing reading taxonomy). */
const METHOD_SUBTOPIC = {
  "RC-M1": "reading_comprehension-main-idea",
  "RC-M2": "reading_comprehension-detail",
  "RC-M3": "reading_comprehension-vocabulary-in-context",
  "RC-M4": "reading_comprehension-detail",
  "RC-M5": "reading_comprehension-inference",
};

function fail(msgs) {
  console.error(`\n${msgs.length} problem${msgs.length === 1 ? "" : "s"} — nothing written:\n`);
  for (const m of msgs) console.error(`  ${m}`);
  process.exit(1);
}

const passageId = (n) => `owner-rc-p${String(n).padStart(2, "0")}`;

function main() {
  const index = readOwnerIndex(indexDocx);
  const units = readOwnerUnits(docx, { unitWord: "קטע", withPassage: true });
  const errors = [];
  const notes = [];
  const items = [];
  const passages = [];

  for (const [pn, U] of [...units].sort((a, b) => a[0] - b[0])) {
    const P = U.passage;
    const at0 = `P${pn}`;
    if (!P.title) errors.push(`${at0}: no title`);
    if (!P.paragraphs.length) errors.push(`${at0}: no paragraphs`);
    P.paragraphs.forEach((p, i) => { if (p.n !== i + 1) errors.push(`${at0}: paragraph numbers jump to (${p.n}) after (${i})`); });
    if (U.questions.size < 5 || U.questions.size > 6) errors.push(`${at0}: ${U.questions.size} questions (want 5–6)`);
    const indexPassage = new Set();
    passages.push({
      passageId: passageId(pn),
      title: P.title,
      // Paragraph numbers stay: questions refer to "paragraph 3".
      bodyMarkdown: P.paragraphs.map((p) => `> (${p.n}) ${p.text}`).join("\n>\n"),
      sourceTag: TAG,
    });

    for (const [qn, it] of [...U.questions].sort((a, b) => a[0] - b[0])) {
      const at = `${at0}Q${qn}`;
      const ix = index.get(`${pn}:${qn}`);
      const sol = it.sol;
      const before = errors.length;
      errors.push(...checkOwnerItem({ at, it, ix, methods: METHODS, acceptPending: ACCEPT_PENDING, requireVocab: false }));
      const primary = resolvePrimaryMethod({ at, ix, sol, methods: METHODS, acceptPending: ACCEPT_PENDING, notes, errors });
      if (ix) indexPassage.add(ix.id.split("/")[0]);
      for (const m of it.stem.matchAll(/paragraphs? (\d+)(?:\s*(?:and|–|-)\s*(\d+))?/gi)) {
        for (const n of [m[1], m[2]].filter(Boolean).map(Number)) {
          if (n > P.paragraphs.length) errors.push(`${at}: asks about paragraph ${n}, the passage has ${P.paragraphs.length}`);
        }
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
        questionId: ix.id.toLowerCase().replace("/", "-"),
        topic: "reading_comprehension",
        subtopic: METHOD_SUBTOPIC[primary],
        difficultyLevel: level,
        questionText: it.stem,
        options,
        correctOptionId: correct,
        explanation,
        distractorExplanations: dx.distractorExplanations,
        estimatedTimeSec: 180,
        passageId: passageId(pn),
        tags: [
          TAG, "shuffle-safe", `owner-rc-passage-${pn}`, "quiz", `difficulty_${level}`,
          `method:${primary}`, ...ix.methods.filter((m) => m !== primary).map((m) => `method:${m}`),
          `theme:${ix.theme}`, ...(ix.level === "L6 top" ? ["l6-top"] : []),
          ...(ix.status === "owner_approved" ? [] : [`owner-status:${ix.status}`]),
        ],
      });
    }
    if (indexPassage.size > 1) errors.push(`${at0}: index rows of this passage carry ${indexPassage.size} different passage ids`);
  }

  if (errors.length) fail(errors);
  for (const n of notes) console.log(`  note ${n}`);

  const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
  for (const n of assignStableIds(items, bank.filter((q) => (q.tags ?? []).includes(TAG)))) console.log(`  id ${n}`);
  const ids = items.map((q) => q.questionId);
  if (new Set(ids).size !== ids.length) fail(["duplicate question ids after id assignment"]);
  const foreign = bank.filter((q) => ids.includes(q.questionId) && !(q.tags ?? []).includes(TAG));
  if (foreign.length) fail(foreign.map((q) => `${q.questionId} is already used by a non-owner question`));
  const allPassages = JSON.parse(fs.readFileSync(PASSAGES, "utf8"));
  const clash = allPassages.filter((p) => p.sourceTag !== TAG && passages.some((x) => x.passageId === p.passageId));
  if (clash.length) fail(clash.map((p) => `passage id ${p.passageId} is already used by ${p.sourceTag}`));

  fs.mkdirSync(path.dirname(OUT_Q), { recursive: true });
  fs.writeFileSync(OUT_Q, `${JSON.stringify(items, null, 2)}\n`);
  fs.writeFileSync(OUT_P, `${JSON.stringify(passages, null, 2)}\n`);
  const per = [...units.keys()].map((p) => `${p}:${items.filter((q) => q.tags.includes(`owner-rc-passage-${p}`)).length}`).join(" ");
  console.log(`Validated ${items.length} items across ${units.size} passages (${per}) → ${path.relative(root, OUT_Q)}, ${path.relative(root, OUT_P)}`);

  if (!MERGE) return;
  const kept = bank.filter((q) => !(q.tags ?? []).includes(TAG));
  fs.writeFileSync(BANK, `${JSON.stringify([...kept, ...items], null, 2)}\n`);
  const keptP = allPassages.filter((p) => p.sourceTag !== TAG);
  fs.writeFileSync(PASSAGES, `${JSON.stringify([...keptP, ...passages], null, 2)}\n`);
  console.log(`Merged: questions.json ${bank.length} → ${kept.length + items.length}, passages.json ${allPassages.length} → ${keptP.length + passages.length}.`);
  console.log("Next: npm run qa:amirant-content && npm run generate:course-manifest");
}

main();
