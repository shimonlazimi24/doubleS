/**
 * Puts the content owner's grammar-in-context tests into the bank.
 *
 * Reads content/amirant-import/owner/grammar-tests.json (from
 * parse-grammar-doc.mjs) and writes 48 questions (topic `grammar`, tags
 * owner_gr + owner-gr-test-N, shuffle-safe) into questions.json. The
 * explanation is the house markdown the quiz card splits: the short
 * explanation opens, the full one with the method and the why-not list
 * collapse. Earlier owner_gr entries are replaced.
 *
 * The document orders the tests from easy to hard and says nothing finer, so
 * each test's difficulty is its position on the scale (DIFFICULTY below); the
 * four questions of a test climb within it, as the document says they do.
 * Prints the lesson titles the manifest should carry (level label from the
 * same scale the other owner units use), so `amirnet-content-sync.ts` can be
 * checked against it.
 *
 * Usage: node scripts/grammar/ingest-grammar-tests.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const TESTS = path.join(root, "content/amirant-import/owner/grammar-tests.json");
const BANK = path.join(root, "content/amirant-import/source/questions.json");
const TAG = "owner_gr";
const OPTION_IDS = ["a", "b", "c", "d"];

/** Per-test difficulty of the four questions, easy to hard across the twelve tests. */
const DIFFICULTY = {
  1: [1, 1, 1, 2],
  2: [1, 1, 2, 2],
  3: [2, 2, 2, 3],
  4: [2, 3, 3, 3],
  5: [3, 3, 3, 4],
  6: [3, 4, 4, 4],
  7: [4, 4, 4, 5],
  8: [4, 5, 5, 5],
  9: [5, 5, 5, 6],
  10: [5, 6, 6, 6],
  11: [6, 6, 6, 6],
  12: [6, 6, 6, 6],
};
/** The last test is the top of the scale, like the owner's "L6 top" items elsewhere. */
const TOP_TESTS = new Set([12]);

/** The owner's method index, kept server-side like the other sets' `method:` tags. */
const METHOD_TAG = {
  "מילות זמן": "GR-M1",
  "מה בא אחרי המילה": "GR-M2",
  "מי עושה מה? פעיל או סביל": "GR-M3",
  "סוג המחבר קובע את המבנה": "GR-M4",
};
const SUBTOPIC = {
  "GR-M1": "grammar-time-markers",
  "GR-M2": "grammar-what-follows",
  "GR-M3": "grammar-active-passive",
  "GR-M4": "grammar-connectors",
};

export const lessonId = (n) => `lesson.grammar.test-${String(n).padStart(2, "0")}`;

/** Same scale as owner-sets.test.ts; a top-tier question counts 6.5. */
export function levelLabel(levels, top) {
  const mean = levels.reduce((s, l) => s + (top ? 6.5 : l), 0) / levels.length;
  const scale = [[2.5, "קל"], [3.5, "קל-בינוני"], [4.25, "בינוני"], [5, "בינוני-קשה"], [5.75, "קשה"], [6.2, "קשה מאוד"]];
  return scale.find(([lim]) => mean < lim)?.[1] ?? "הקשה ביותר";
}

const escapeMd = (s) => s.replace(/([*_`])/g, "\\$1");

function explanationMarkdown(q) {
  const parts = [
    `**הסבר קצר:** ${escapeMd(q.shortHe)}`,
    `_${escapeMd(q.shortEn)}_`,
    `**הסבר מלא:** ${escapeMd(q.fullHe)}`,
    `שיטה: ${escapeMd(q.method.nameHe)} — ${escapeMd(q.method.he)}`,
    `_${escapeMd(q.method.nameEn)}: ${escapeMd(q.method.en)}_`,
    "**למה לא האפשרויות האחרות**",
  ];
  for (const w of q.whyNot) {
    parts.push(`${escapeMd(w.option)} — ${escapeMd(w.he)}`, `_${escapeMd(w.en)}_`);
  }
  if (q.finalNote) parts.push(`_${escapeMd(q.finalNote)}_`);
  parts.push(`**תשובה סופית: ${escapeMd(q.options[q.correct])}**`);
  if (q.words.length) {
    parts.push(`**מילים לשינון:** ${q.words.map((w) => `${escapeMd(w.word)} [${escapeMd(w.pronunciation)}] – ${escapeMd(w.meaningHe)}`).join(" · ")}`);
  }
  return parts.join("\n\n");
}

const { tests } = JSON.parse(fs.readFileSync(TESTS, "utf8"));
const items = [];
const titles = [];
for (const t of tests) {
  const n = t.number;
  const levels = DIFFICULTY[n];
  if (!levels) throw new Error(`no difficulty row for test ${n}`);
  const top = TOP_TESTS.has(n);
  t.questions.forEach((q, qi) => {
    const level = levels[qi];
    const method = METHOD_TAG[q.method.nameHe];
    if (!method) throw new Error(`test ${n} q${q.number}: unknown method ${q.method.nameHe}`);
    const wrongIds = Object.fromEntries(q.whyNot.map((w) => [OPTION_IDS[q.options.indexOf(w.option)], w]));
    items.push({
      questionId: `owner-gr-test-${n}-q${q.number}`,
      topic: "grammar",
      subtopic: SUBTOPIC[method],
      difficultyLevel: level,
      questionText: q.stem,
      options: q.options.map((label, i) => ({ id: OPTION_IDS[i], label })),
      correctOptionId: OPTION_IDS[q.correct],
      explanation: explanationMarkdown(q),
      distractorExplanations: Object.fromEntries(Object.entries(wrongIds).map(([id, w]) => [id, `${w.he}\n\n${w.en}`])),
      estimatedTimeSec: 60,
      tags: [TAG, "shuffle-safe", `owner-gr-test-${n}`, "quiz", `difficulty_${level}`, `method:${method}`, ...(top ? ["l6-top"] : [])],
    });
  });
  titles.push({ id: lessonId(n), title: `מבחן דקדוק בהקשר ${n} (${levelLabel(levels, top)})` });
}

const bank = JSON.parse(fs.readFileSync(BANK, "utf8"));
const kept = bank.filter((q) => !(q.tags ?? []).includes(TAG));
const foreign = kept.filter((q) => items.some((i) => i.questionId === q.questionId));
if (foreign.length) {
  console.error(foreign.map((q) => `${q.questionId} is already used by a non-grammar question`).join("\n"));
  process.exit(1);
}
fs.writeFileSync(BANK, `${JSON.stringify([...kept, ...items], null, 2)}\n`);

console.log(`Merged: questions.json ${bank.length} → ${kept.length + items.length} (${items.length} grammar questions).`);
console.log("Lesson titles:");
for (const t of titles) console.log(`  { id: "${t.id}", title: "${t.title}", kind: "text", estimatedMinutes: 6 },`);
console.log("Next: npm run generate:course-manifest");
