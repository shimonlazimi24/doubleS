/**
 * One-time (idempotent) content-integrity pass over the imported question bank.
 *
 * Fixes four defects that survived the markdown import and that the QA gate did
 * not look for:
 *
 *   1. STEMS      Section headings, emoji and Hebrew instructions that bled from
 *                 the source markdown into `questionText` / option labels.
 *   2. TAGGING    Items whose `topic` / `subtopic` contradict their own shape
 *                 (a question with a `passageId` is reading comprehension; a
 *                 stem starting with "Original:" is a restatement item).
 *   3. KEY BALANCE  The correct answer sat at position b in 41% of items and at
 *                 d in 10%. Options are re-seated so every topic is balanced
 *                 across a/b/c/d, and every (A)-(D) reference inside the
 *                 explanation is remapped to match.
 *   4. PASSAGES   Missing / malformed passage titles (the title lived inside the
 *                 body, so six passages rendered with no title at all).
 *
 * Deterministic and idempotent: options are canonicalised before permuting, and
 * every random choice is seeded from the question id, so running the script
 * twice produces byte-identical output.
 *
 * Usage:
 *   node scripts/fix-content-integrity.mjs [--dry-run]
 * Afterwards, regenerate the client bank:
 *   npm run generate:questions-public
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "content", "amirant-import", "source");
const QUESTIONS_PATH = path.join(SRC, "questions.json");
const PASSAGES_PATH = path.join(SRC, "passages.json");
const DRY_RUN = process.argv.includes("--dry-run");

const OPTION_IDS = ["a", "b", "c", "d"];

// ── seeded rng ───────────────────────────────────────────────────────────────

function hashSeed(seed) {
  let h = 2166136261 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── 1. stem / label cleaning ─────────────────────────────────────────────────

/**
 * Markdown headings never belong inside a question stem: everything from the
 * first heading marker onwards is the *next* section of the source file that the
 * importer swallowed. Truncate there, but only when a usable stem remains, so a
 * malformed item is left visible rather than silently emptied.
 */
function cleanStem(raw) {
  let text = String(raw ?? "");

  const headingAt = text.search(/(?:^|\s)#{1,6}\s/);
  if (headingAt > 0 && text.slice(0, headingAt).trim().length >= 15) {
    text = text.slice(0, headingAt);
  }

  return text
    // Difficulty markers from the source quiz ("🟢 (Easy)", "🔴 (Hard)") leaked
    // into the stem. Beyond looking unfinished, they tell the learner how hard
    // an item is before they answer — which is the one thing a mixed set must
    // not do. The level already lives in `difficultyLevel`.
    .replace(/^\s*[\u{1F534}\u{1F7E1}\u{1F7E2}\u{1F535}\u{1F7E0}\u{26AA}\u{26AB}]\s*\((?:Easy|Intermediate|Hard|Medium)\)\s*/giu, "")
    .replace(/^\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]\s+/gu, "")
    .replace(/\*\*\s*Original:\s*\*\*/gi, "Original:") // bold marker from the source table
    .replace(/\s*-{3,}\s*$/g, "") // trailing horizontal rule
    .replace(/[ \t]*\n[ \t]*/g, " ") // stems are single-line by contract
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanLabel(raw) {
  return String(raw ?? "")
    .replace(/(?:^|\s)#{1,6}\s.*$/s, "")
    .replace(/^\*\*(.*)\*\*$/s, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── 2. structural re-tagging ─────────────────────────────────────────────────

const SUBTOPIC_BY_TOPIC = {
  reading_comprehension: "reading_comprehension-simulation-mixed",
  rephrasing: "rephrasing-simulation-restatement",
  sentence_completion: "sentence_completion-simulation",
  vocabulary: "vocab-simulation",
};

/**
 * The item's own shape is the authority, not the tag the importer wrote:
 * a passage reference means reading comprehension, an "Original:" stem means
 * restatement. Returns null when the existing topic is already consistent.
 */
function inferredTopic(q) {
  if (q.passageId) return "reading_comprehension";
  if (/^\s*(\*\*)?Original:/i.test(String(q.questionText ?? ""))) return "rephrasing";
  return null;
}

/**
 * Word-formation items ("The scientist's discovery was truly ______. (REVOLUTION)")
 * are a distinct 2026-reform skill, but the bank has only four topics. Keep the
 * topic and mark the skill in the subtopic so the item is at least identifiable
 * — and so a future `word_formation` topic is a rename, not an archaeology dig.
 */
function isWordFormationStem(text) {
  return /_{3,}[^()]*\(\s*[A-Z]{3,}\s*\)\s*$/.test(String(text ?? "").trim());
}

// ── 3. answer-key balancing ──────────────────────────────────────────────────

/**
 * Rewrites the (A)-(D) references inside an explanation in a single pass, so a
 * chain like A→B→C cannot cascade: every marker is resolved against the old
 * mapping simultaneously.
 */
function remapExplanationLetters(text, oldIndexToNewIndex) {
  return String(text ?? "").replace(/\(([A-D])\)/g, (match, letter) => {
    const oldIndex = letter.charCodeAt(0) - 65;
    const newIndex = oldIndexToNewIndex[oldIndex];
    if (newIndex === undefined) return match;
    return `(${String.fromCharCode(65 + newIndex)})`;
  });
}

/**
 * Assigns each item in a topic a target slot for its correct answer, cycling
 * a/b/c/d over a deterministically shuffled order so the marginal distribution
 * is exactly balanced instead of merely random.
 */
function targetSlotsForTopic(questionIds) {
  const rng = mulberry32(hashSeed(`slot:${questionIds.length}:${questionIds[0] ?? ""}`));
  const order = shuffled(questionIds, rng);
  const slots = new Map();
  order.forEach((id, i) => slots.set(id, i % OPTION_IDS.length));
  return slots;
}

function rebalanceQuestion(q, targetIndex) {
  const options = q.options ?? [];
  if (options.length !== OPTION_IDS.length) return false;

  const correctIndexBefore = options.findIndex((o) => o.id === q.correctOptionId);
  if (correctIndexBefore < 0) return false;

  // Canonicalise first so the permutation depends only on content + id, never on
  // the order left behind by a previous run.
  const canonical = [...options].sort((x, y) => x.label.localeCompare(y.label, "en"));
  const correctLabel = options[correctIndexBefore].label;
  const distractors = canonical.filter((o) => o.label !== correctLabel);
  if (distractors.length !== OPTION_IDS.length - 1) return false; // duplicate labels — leave alone

  const rng = mulberry32(hashSeed(`opt:${q.questionId}`));
  const seatedDistractors = shuffled(distractors, rng);

  const seatedLabels = [];
  let cursor = 0;
  for (let i = 0; i < OPTION_IDS.length; i++) {
    seatedLabels[i] = i === targetIndex ? correctLabel : seatedDistractors[cursor++].label;
  }

  // old display index → new display index, for the explanation remap
  const oldIndexToNewIndex = {};
  options.forEach((o, oldIndex) => {
    oldIndexToNewIndex[oldIndex] = seatedLabels.indexOf(o.label);
  });

  const changed =
    seatedLabels.some((label, i) => label !== options[i].label) ||
    q.correctOptionId !== OPTION_IDS[targetIndex];

  q.options = seatedLabels.map((label, i) => ({ id: OPTION_IDS[i], label }));
  q.correctOptionId = OPTION_IDS[targetIndex];
  q.explanation = remapExplanationLetters(q.explanation, oldIndexToNewIndex);
  if (q.distractorExplanations && Object.keys(q.distractorExplanations).length > 0) {
    const remapped = {};
    for (const [id, body] of Object.entries(q.distractorExplanations)) {
      const oldIndex = OPTION_IDS.indexOf(id);
      const newIndex = oldIndex >= 0 ? oldIndexToNewIndex[oldIndex] : -1;
      remapped[newIndex >= 0 ? OPTION_IDS[newIndex] : id] = remapExplanationLetters(body, oldIndexToNewIndex);
    }
    q.distractorExplanations = remapped;
  }

  return changed;
}

// ── 4. passage titles ────────────────────────────────────────────────────────

/**
 * Six passages shipped with an empty title and one with a stray leading colon,
 * because the title lives as the first bold line of the body. Lift it out and
 * drop the duplicate from the body.
 */
function normalizeTitle(raw) {
  return String(raw ?? "")
    .replace(/^[\s:：-]+/, "")
    .replace(/^[\p{Extended_Pictographic}️\s]+/u, "") // leading 📖 and friends
    .replace(/^Passage\s*\d*\s*[:：-]\s*/i, "") // "Passage 2: " label from the source file
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fixPassage(p) {
  const before = JSON.stringify(p);
  const lines = String(p.bodyMarkdown ?? "").split("\n");

  let firstIndex = lines.findIndex((l) => l.replace(/^>\s?/, "").trim().length > 0);
  const firstLine = firstIndex >= 0 ? lines[firstIndex].replace(/^>\s?/, "").trim() : "";
  const headingMatch = firstLine.match(/^(?:\*\*(.+?)\*\*|#{1,6}\s+(.+?))\s*$/);
  const extracted = headingMatch ? (headingMatch[1] ?? headingMatch[2] ?? "").trim() : "";

  const currentTitle = normalizeTitle(p.title);

  if (extracted) {
    p.title = normalizeTitle(extracted);
    lines.splice(firstIndex, 1);
    while (lines.length && lines[0].replace(/^>\s?/, "").trim() === "") lines.shift();
    p.bodyMarkdown = lines.join("\n");
  } else if (currentTitle !== p.title) {
    p.title = currentTitle;
  }

  return JSON.stringify(p) !== before;
}

// ── report helpers ───────────────────────────────────────────────────────────

function keyDistribution(questions) {
  const counts = Object.fromEntries(OPTION_IDS.map((id) => [id, 0]));
  for (const q of questions) if (counts[q.correctOptionId] !== undefined) counts[q.correctOptionId]++;
  return counts;
}

function chiSquareUniform(counts, total) {
  const expected = total / OPTION_IDS.length;
  if (expected === 0) return 0;
  return OPTION_IDS.reduce((sum, id) => sum + (counts[id] - expected) ** 2 / expected, 0);
}

function longestCorrectRate(questions) {
  const byTopic = {};
  for (const q of questions) {
    const lens = (q.options ?? []).map((o) => o.label.length);
    const correct = (q.options ?? []).find((o) => o.id === q.correctOptionId);
    if (!correct || lens.length === 0) continue;
    byTopic[q.topic] ??= { n: 0, longest: 0 };
    byTopic[q.topic].n++;
    if (correct.label.length === Math.max(...lens)) byTopic[q.topic].longest++;
  }
  return Object.fromEntries(
    Object.entries(byTopic).map(([topic, v]) => [topic, { n: v.n, rate: Number((v.longest / v.n).toFixed(3)) }]),
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const passages = JSON.parse(fs.readFileSync(PASSAGES_PATH, "utf8"));

  const before = {
    keys: keyDistribution(questions),
    longest: longestCorrectRate(questions),
  };

  const changes = { stems: [], labels: 0, retagged: [], reseated: 0, passages: [] };

  // 1. stems + labels
  for (const q of questions) {
    const cleanedStem = cleanStem(q.questionText);
    if (cleanedStem !== q.questionText) {
      changes.stems.push(q.questionId);
      q.questionText = cleanedStem;
    }
    for (const option of q.options ?? []) {
      const cleaned = cleanLabel(option.label);
      if (cleaned !== option.label) {
        changes.labels++;
        option.label = cleaned;
      }
    }
  }

  // 2. re-tagging (after stem cleaning, which exposes the "Original:" prefix)
  for (const q of questions) {
    const topic = inferredTopic(q);
    if (topic && topic !== q.topic) {
      changes.retagged.push(`${q.questionId}: ${q.topic} → ${topic}`);
      q.topic = topic;
      q.subtopic = SUBTOPIC_BY_TOPIC[topic] ?? q.subtopic;
      q.estimatedTimeSec = topic === "reading_comprehension" ? 110 : q.estimatedTimeSec;
    }
    if (isWordFormationStem(q.questionText) && q.subtopic !== "sentence_completion-word-formation") {
      changes.retagged.push(`${q.questionId}: subtopic → word-formation`);
      q.subtopic = "sentence_completion-word-formation";
    }
  }

  // 3. key balancing, stratified per topic
  const byTopic = new Map();
  for (const q of questions) {
    if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
    byTopic.get(q.topic).push(q);
  }
  for (const [, topicQuestions] of byTopic) {
    const sorted = [...topicQuestions].sort((x, y) => x.questionId.localeCompare(y.questionId));
    const slots = targetSlotsForTopic(sorted.map((q) => q.questionId));
    for (const q of sorted) {
      if (rebalanceQuestion(q, slots.get(q.questionId))) changes.reseated++;
    }
  }

  // 4. passages
  for (const p of passages) {
    if (fixPassage(p)) changes.passages.push(p.passageId);
  }

  const after = {
    keys: keyDistribution(questions),
    longest: longestCorrectRate(questions),
  };

  // consistency check: the letter named as correct in the explanation must match the key
  const mismatches = questions.filter((q) => {
    const m = q.explanation?.match(/Why\s*\(([A-D])\)\s*is correct/i);
    return m && m[1].toLowerCase() !== q.correctOptionId;
  });

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        totalQuestions: questions.length,
        stemsCleaned: changes.stems.length,
        optionLabelsCleaned: changes.labels,
        retagged: changes.retagged.length,
        optionsReseated: changes.reseated,
        passagesFixed: changes.passages,
        keyDistribution: { before: before.keys, after: after.keys },
        chiSquare: {
          before: Number(chiSquareUniform(before.keys, questions.length).toFixed(2)),
          after: Number(chiSquareUniform(after.keys, questions.length).toFixed(2)),
          criticalValue005df3: 7.81,
        },
        longestOptionIsCorrect: { before: before.longest, after: after.longest },
        explanationKeyMismatches: mismatches.length,
      },
      null,
      2,
    ),
  );

  if (changes.retagged.length) {
    console.log("\nRe-tagged items:");
    for (const line of changes.retagged) console.log(`  ${line}`);
  }
  if (changes.stems.length) {
    console.log(`\nStems cleaned: ${changes.stems.join(", ")}`);
  }

  if (mismatches.length > 0) {
    console.error(`\nABORT: ${mismatches.length} explanations disagree with the answer key after remap.`);
    process.exit(2);
  }

  if (DRY_RUN) {
    console.log("\nDry run — nothing written.");
    return;
  }

  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(questions, null, 2)}\n`);
  fs.writeFileSync(PASSAGES_PATH, `${JSON.stringify(passages, null, 2)}\n`);
  console.log("\nWrote questions.json and passages.json. Run: npm run generate:questions-public");
}

main();
