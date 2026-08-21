/**
 * Assigns a real subtopic to every question, from the shape of the item itself.
 *
 * The bank shipped with a degenerate taxonomy: all 116 sentence-completion items
 * were tagged "contrast-linkers", all 100 restatement items
 * "inversion-conditionals", all 51 reading items "main-idea" — including
 * "Maria always arrives on time", which is neither an inversion nor a
 * conditional. The weak-area feature therefore had four buckets to work with and
 * could only ever say "you are weak at reading comprehension".
 *
 * Every rule below matches text that is already in the question. Nothing is
 * inferred about meaning, and an item that matches no rule keeps a neutral
 * subtopic and is listed at the end for a human to look at — a wrong label is
 * worse than a general one, because it sends the learner to the wrong practice.
 *
 * Usage: node scripts/tag-question-subtopics.mjs [--dry-run]
 * Then:  npm run generate:questions-public
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "content", "amirant-import", "source", "questions.json");
const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Subtopics carry their topic as a prefix — the convention the pedagogical QA
 * enforces, and what keeps prefix filtering predictable.
 *
 * Ordered rules — the first match wins, so the more specific patterns come
 * first. `test` receives the stem; for reading items it is the question, since
 * the passage is shared by the whole set.
 */
const RULES = {
  reading_comprehension: [
    ["reading_comprehension-main-idea", /main idea|best title|primary purpose|mainly (?:about|discusses)/i],
    ["reading_comprehension-vocabulary-in-context", /the (?:phrase|word) ".+?".*(?:means|suggests|refers)|most likely means|as used in/i],
    ["reading_comprehension-inference", /can be inferred|implies|suggests that|author's attitude|would probably agree|tone of/i],
    ["reading_comprehension-detail", /according to the passage|which of the following is (?:not )?mentioned|is supported by the passage|state[sd] that/i],
    ["reading_comprehension-detail", /^(?:where|when|who|how|what happened|what percentage|which statement)/i],
  ],
  rephrasing: [
    ["rephrasing-inversion", /\b(?:no sooner|hardly had|scarcely had|not only|little did|rarely (?:have|has|did)|never (?:have|has|before)|so \w+ was|were it not for|had (?:the|he|she|they|it) \w+)\b/i],
    ["rephrasing-conditional", /\bif\b.*\b(?:would|could|might|were)\b|unless\b|otherwise\b|but for\b/i],
    ["rephrasing-passive", /\b(?:is|are|was|were|been|being|be) \w+(?:ed|en)\b.*\bby\b|it is (?:widely )?(?:believed|thought|said|expected|reported)/i],
    ["rephrasing-concession", /\b(?:despite|although|though|even though|however|nevertheless|contrary to|regardless)\b/i],
    ["rephrasing-cause-effect", /\b(?:because|due to|owing to|as a result|therefore|consequently|thanks to|on the grounds that|since)\b/i],
    ["rephrasing-comparison", /\b(?:\w+er than|more \w+ than|less \w+ than|as \w+ as|the (?:most|least|\w+est))\b|would rather/i],
    ["rephrasing-negation", /\b(?:cannot|can't|do(?:es)? not|did not|is not|are not|was not|were not|n't|no one|none|never|not as)\b/i],
    ["rephrasing-quantifier-scope", /\b(?:all|every|most|few|several|rarely|seldom|always|only|must|required|expected)\b/i],
  ],
  sentence_completion: [
    ["sentence_completion-word-formation", /_{3,}[^()]*\(\s*[A-Z]{3,}\s*\)\s*$/],
    ["sentence_completion-contrast-linker", /\b(?:although|though|despite|however|whereas|while|nevertheless|yet|on the other hand)\b/i],
    ["sentence_completion-cause-linker", /\b(?:because|since|therefore|thus|consequently|so that|as a result|due to)\b/i],
    ["sentence_completion-grammar-in-context", /\b(?:if i (?:were|was)|by the time|has been|have been|had been|one of the most|which i|that i)\b/i],
    ["sentence_completion-collocation", /\b(?:make|take|do|have|give|pay|reach|draw|hold|raise)\s+_{3,}|_{3,}\s+(?:a decision|attention|place|effect|part)/i],
  ],
  vocabulary: [],
};

/**
 * The default when no structural pattern fires. These are not "unknown": they
 * are what the item is when it carries no special structure. A sentence
 * completion with no linker and no word-formation cue is testing vocabulary in
 * context — that is the skill the section exists to test. A restatement of "Tom
 * is a very tall boy" is plain paraphrase.
 */
const DEFAULT_SUBTOPIC = {
  reading_comprehension: "reading_comprehension-detail",
  rephrasing: "rephrasing-paraphrase",
  sentence_completion: "sentence_completion-vocabulary-in-context",
  vocabulary: null, // vocabulary already carries meaningful subtopics
};

function classify(question) {
  const rules = RULES[question.topic] ?? [];
  const text = String(question.questionText ?? "");
  for (const [subtopic, pattern] of rules) {
    if (pattern.test(text)) return { subtopic, matched: true };
  }
  const fallback = DEFAULT_SUBTOPIC[question.topic];
  return fallback ? { subtopic: fallback, matched: false } : null;
}

function main() {
  const questions = JSON.parse(fs.readFileSync(SRC, "utf8"));

  const before = {};
  for (const q of questions) {
    before[q.topic] ??= new Set();
    before[q.topic].add(q.subtopic);
  }

  const unmatched = [];
  let changed = 0;
  for (const q of questions) {
    const result = classify(q);
    if (!result) continue;
    if (!result.matched) unmatched.push(`${q.questionId}: ${String(q.questionText).slice(0, 70)}`);
    if (q.subtopic !== result.subtopic) {
      q.subtopic = result.subtopic;
      changed += 1;
    }
  }

  const after = {};
  for (const q of questions) {
    after[q.topic] ??= {};
    after[q.topic][q.subtopic] = (after[q.topic][q.subtopic] ?? 0) + 1;
  }

  console.log(`items retagged: ${changed}\n`);
  for (const [topic, counts] of Object.entries(after)) {
    console.log(`${topic}  (was ${before[topic].size} subtopic${before[topic].size === 1 ? "" : "s"})`);
    for (const [sub, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${String(n).padStart(4)}  ${sub}`);
    }
    console.log();
  }

  console.log(`took the topic default rather than a structural rule: ${unmatched.length}`);
  for (const line of unmatched.slice(0, 12)) console.log(`   ${line}`);
  if (unmatched.length > 12) console.log(`   … and ${unmatched.length - 12} more`);

  if (DRY_RUN) {
    console.log("\nDry run — nothing written.");
    return;
  }
  fs.writeFileSync(SRC, `${JSON.stringify(questions, null, 2)}\n`);
  console.log("\nWrote questions.json. Run: npm run generate:questions-public");
}

main();
