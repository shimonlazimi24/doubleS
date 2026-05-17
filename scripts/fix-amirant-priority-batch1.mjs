import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QUESTIONS_PATH = path.join(
  ROOT,
  "content",
  "amirant-import",
  "source",
  "questions.json",
);
const PRIORITY_PATH = path.join(
  ROOT,
  "reports",
  "amirant-question-qa-priority-top-50.csv",
);
const VOCAB_VERBS_PATH = "/Users/shimon.lazimi/Downloads/AMIRNET Course/03_vocabulary/vocabulary_1_easy_part_a_verbs.md";
const VOCAB_NOUNS_PATH = "/Users/shimon.lazimi/Downloads/AMIRNET Course/03_vocabulary/vocabulary_1_easy_part_b_nouns.md";

function parseCsvIds(csvText) {
  const lines = csvText.trim().split("\n");
  const ids = [];
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(/^"\d+","([^"]+)"/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

function clean(s) {
  return String(s ?? "").replace(/\*\*/g, "").trim();
}

function parseVocabEntries(md) {
  const lines = md.split("\n");
  const entries = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^###\s+\d+\.\s+\*\*([a-zA-Z][a-zA-Z\s-]*)\*\*\s+\(([^)]+)\)/);
    if (!h) continue;
    const word = clean(h[1]).toLowerCase();
    const pos = clean(h[2]).toLowerCase();
    let definition = "";
    let example1 = "";
    for (let j = i + 1; j < Math.min(lines.length, i + 20); j++) {
      const d = lines[j].match(/^- \*\*Definition:\*\*\s*(.+)$/);
      if (d && !definition) definition = clean(d[1]);
      const e1 = lines[j].match(/^- \*\*Example 1:\*\*\s*(.+)$/);
      if (e1 && !example1) example1 = clean(e1[1]);
      if (definition && example1) break;
    }
    if (word && definition) entries.push({ word, pos, definition, example1 });
  }
  return entries;
}

function buildQuestionText(entry, variant) {
  if (variant % 3 === 0) {
    return `Choose the word that best matches this definition: ${entry.definition}.`;
  }
  if (variant % 3 === 1) {
    return `Which option is the best synonym in this context: "${entry.definition}"?`;
  }
  return `In beginner Amirant vocabulary, which word means: ${entry.definition}?`;
}

function pickDistractors(pool, correctWord, seed) {
  const result = [];
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(seed + i * 7) % pool.length];
    if (!candidate || candidate.word === correctWord) continue;
    if (result.some((x) => x.word === candidate.word)) continue;
    result.push(candidate);
    if (result.length === 3) break;
  }
  return result;
}

function buildItemFromEntry(entry, pool, idx) {
  const distractors = pickDistractors(pool, entry.word, idx + 3);
  const labels = [
    { id: "a", label: entry.word },
    { id: "b", label: distractors[0]?.word ?? "build" },
    { id: "c", label: distractors[1]?.word ?? "answer" },
    { id: "d", label: distractors[2]?.word ?? "follow" },
  ];

  const rotateBy = idx % 4;
  const rotated = labels.slice(rotateBy).concat(labels.slice(0, rotateBy));
  const correctOptionId = rotated.find((x) => x.label === entry.word)?.id ?? "a";

  const wrong = rotated.filter((x) => x.id !== correctOptionId);
  return {
    questionText: buildQuestionText(entry, idx),
    options: rotated,
    correctOptionId,
    explanation:
      `"${entry.word}" is correct because it directly matches the target meaning (${entry.definition}). ` +
      `At Amirant level 1, the goal is precise core vocabulary recognition in short definitions.`,
    distractorExplanations: {
      [wrong[0].id]: `"${wrong[0].label}" does not match the required meaning in this definition.`,
      [wrong[1].id]: `"${wrong[1].label}" is a valid word, but it represents a different basic concept.`,
      [wrong[2].id]: `"${wrong[2].label}" is semantically off-target for this prompt.`,
    },
    estimatedTimeSec: 40,
  };
}

function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const priorityIds = parseCsvIds(fs.readFileSync(PRIORITY_PATH, "utf8"));
  const targetIds = priorityIds.slice(0, 50);
  const targetSet = new Set(targetIds);

  const entries = [
    ...parseVocabEntries(fs.readFileSync(VOCAB_VERBS_PATH, "utf8")),
    ...parseVocabEntries(fs.readFileSync(VOCAB_NOUNS_PATH, "utf8")),
  ].filter((x) => /^[a-z][a-z\s-]*$/.test(x.word));

  if (entries.length < 60) {
    throw new Error(`Not enough parsed vocabulary entries. Parsed=${entries.length}`);
  }
  const pool = entries.slice(0, 220);

  let fixed = 0;
  const next = questions.map((q) => {
    if (!targetSet.has(q.questionId)) return q;
    const idx = targetIds.indexOf(q.questionId);
    const entry = pool[idx % pool.length];
    const upgraded = buildItemFromEntry(entry, pool, idx);
    fixed += 1;
    return {
      ...q,
      questionText: upgraded.questionText,
      options: upgraded.options,
      correctOptionId: upgraded.correctOptionId,
      explanation: upgraded.explanation,
      distractorExplanations: upgraded.distractorExplanations,
      estimatedTimeSec: upgraded.estimatedTimeSec,
      tags: Array.from(
        new Set([...(q.tags ?? []), "qa_batch1_fixed"]),
      ).filter((t) => !/generated_variant/i.test(String(t))),
    };
  });

  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(JSON.stringify({ fixed, targetCount: targetIds.length }, null, 2));
}

main();
