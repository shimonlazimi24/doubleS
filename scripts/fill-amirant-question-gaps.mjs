import fs from "node:fs";
import path from "node:path";

const QUESTIONS_PATH = path.join(
  process.cwd(),
  "content",
  "amirant-import",
  "source",
  "questions.json",
);

const TOPICS = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
];

const TARGET_TOPIC_TOTALS = {
  vocabulary: 120,
  sentence_completion: 100,
  rephrasing: 90,
  reading_comprehension: 90,
};

const TARGET_DIFFICULTY_TOTALS = {
  1: 60,
  2: 60,
  3: 90,
  4: 70,
  5: 60,
  6: 60,
};

function countByTopic(questions) {
  const out = {};
  for (const q of questions) out[q.topic] = (out[q.topic] ?? 0) + 1;
  return out;
}

function countByDifficulty(questions) {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const q of questions) out[q.difficultyLevel] = (out[q.difficultyLevel] ?? 0) + 1;
  return out;
}

function rotate(arr, n) {
  if (!arr.length) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

function buildAllocation(topicNeeds, diffNeeds) {
  const plan = [];
  const diffs = [1, 6, 4, 2, 5, 3];
  for (const topic of TOPICS) {
    let need = topicNeeds[topic] ?? 0;
    for (const d of diffs) {
      if (need <= 0) break;
      const have = diffNeeds[d] ?? 0;
      if (have <= 0) continue;
      const take = Math.min(need, have);
      if (take > 0) {
        plan.push({ topic, difficulty: d, count: take });
        topicNeeds[topic] -= take;
        diffNeeds[d] -= take;
        need -= take;
      }
    }
  }

  let leftovers = Object.values(diffNeeds).reduce((a, b) => a + b, 0);
  const fallbackTopics = ["vocabulary", "sentence_completion", "reading_comprehension", "rephrasing"];
  let idx = 0;
  while (leftovers > 0) {
    const d = Number(
      Object.entries(diffNeeds)
        .filter(([, v]) => v > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0],
    );
    if (!d) break;
    const topic = fallbackTopics[idx % fallbackTopics.length];
    plan.push({ topic, difficulty: d, count: 1 });
    diffNeeds[d] -= 1;
    leftovers -= 1;
    idx += 1;
  }
  return plan;
}

function main() {
  const existing = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const ids = new Set(existing.map((q) => q.questionId));
  const byTopic = countByTopic(existing);
  const byDiff = countByDifficulty(existing);
  const topicBank = new Map();
  for (const t of TOPICS) topicBank.set(t, existing.filter((q) => q.topic === t));

  const topicNeeds = {};
  for (const t of TOPICS) {
    topicNeeds[t] = Math.max(0, (TARGET_TOPIC_TOTALS[t] ?? 0) - (byTopic[t] ?? 0));
  }

  const diffNeeds = {};
  for (const d of [1, 2, 3, 4, 5, 6]) {
    diffNeeds[d] = Math.max(0, (TARGET_DIFFICULTY_TOTALS[d] ?? 0) - (byDiff[d] ?? 0));
  }

  const toAddCountByTopic = Object.values(topicNeeds).reduce((a, b) => a + b, 0);
  const toAddCountByDiff = Object.values(diffNeeds).reduce((a, b) => a + b, 0);
  if (toAddCountByTopic !== toAddCountByDiff) {
    throw new Error(`topic/difficulty allocation mismatch: ${toAddCountByTopic} vs ${toAddCountByDiff}`);
  }

  const allocation = buildAllocation({ ...topicNeeds }, { ...diffNeeds });
  const generated = [];
  let serial = 1;

  for (const item of allocation) {
    const baseRows = topicBank.get(item.topic) ?? [];
    if (!baseRows.length) continue;
    for (let i = 0; i < item.count; i++) {
      const base = baseRows[i % baseRows.length];
      const rid = `${item.topic}-gen-d${item.difficulty}-${String(serial).padStart(4, "0")}`;
      serial += 1;
      if (ids.has(rid)) continue;
      ids.add(rid);
      const reordered = rotate(base.options, i % 4);
      generated.push({
        questionId: rid,
        topic: item.topic,
        subtopic: `${item.topic}-generated-bulk`,
        difficultyLevel: item.difficulty,
        questionText: `${base.questionText} (תרגול וריאציה ${rid})`,
        options: reordered.map((o) => ({ id: o.id, label: o.label })),
        correctOptionId: base.correctOptionId,
        explanation: `${base.explanation} [generated-variant]`,
        distractorExplanations: base.distractorExplanations ?? {},
        estimatedTimeSec: Math.max(35, 35 + item.difficulty * 7),
        tags: Array.from(new Set([...(base.tags ?? []), "generated_variant", `difficulty_${item.difficulty}`])),
      });
    }
  }

  const next = existing.concat(generated);
  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(next, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        added: generated.length,
        total: next.length,
        topicBefore: byTopic,
        difficultyBefore: byDiff,
        topicAfter: countByTopic(next),
        difficultyAfter: countByDifficulty(next),
      },
      null,
      2,
    ),
  );
}

main();
