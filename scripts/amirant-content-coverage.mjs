import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "content", "amirant-import", "source");

function readJson(file, fallback) {
  const p = path.join(sourceDir, file);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const lessons = readJson("lessons.json", []);
const questions = readJson("questions.json", []);
const practiceSets = readJson("practice-sets.json", []);
const simulations = readJson("simulations.json", []);
const aiRetrieval = readJson("ai-retrieval.json", []);
const mapping = readJson("syllabus-mapping.json", { parts: [] });

const byTopic = {};
const bySubtopic = {};
const byDifficulty = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
for (const q of questions) {
  byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1;
  bySubtopic[q.subtopic] = (bySubtopic[q.subtopic] ?? 0) + 1;
  if (q.difficultyLevel >= 1 && q.difficultyLevel <= 6) {
    byDifficulty[q.difficultyLevel] += 1;
  }
}

const rows = [];
for (const part of mapping.parts ?? []) {
  for (const item of part.items ?? []) {
    let status = "missing";
    if (item.artifactType === "lesson") status = lessons.length ? "implemented" : "missing";
    if (item.artifactType === "question_bank_batch") status = questions.length ? "implemented" : "missing";
    if (item.artifactType === "practice_set") status = practiceSets.length ? "implemented" : "missing";
    if (item.artifactType === "simulation_section") status = simulations.length ? "implemented" : "missing";
    if (item.artifactType === "ai_retrieval") status = aiRetrieval.length ? "implemented" : "missing";
    rows.push({
      syllabusSectionId: item.syllabusBulletId,
      mappedModule: item.moduleSlug,
      artifactType: item.artifactType,
      status,
    });
  }
}

const report = {
  rows,
  questionsByTopic: byTopic,
  questionsBySubtopic: bySubtopic,
  questionsByDifficulty: byDifficulty,
  minimumRequired: {
    totalQuestions: 400,
    minPerTopic: 80,
    minPerDifficulty: 50,
  },
  gapCount: {
    totalQuestions: Math.max(0, 400 - questions.length),
  },
};

console.log(JSON.stringify(report, null, 2));
