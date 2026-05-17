import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "reports", "amirant-coverage.json");
const outputPath = path.join(root, "reports", "amirant-coverage-matrix.csv");

const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function csvCell(value) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function row(values) {
  return values.map(csvCell).join(",");
}

const lines = [
  row([
    "bucket_type",
    "bucket_id",
    "artifact_type",
    "status",
    "current_count",
    "minimum_required",
    "missing_count",
    "notes",
  ]),
];

for (const r of report.rows ?? []) {
  lines.push(
    row([
      "syllabus_section",
      r.syllabusSectionId,
      r.artifactType,
      r.status,
      "",
      "",
      "",
      r.mappedModule ?? "",
    ]),
  );
}

const minPerTopic = report.minimumRequired?.minPerTopic ?? 0;
const canonicalTopics = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
];
for (const topic of canonicalTopics) {
  const count = Number(report.questionsByTopic?.[topic] ?? 0);
  const missing = Math.max(0, minPerTopic - count);
  lines.push(
    row([
      "topic_bucket",
      topic,
      "question_bank_batch",
      missing > 0 ? "gap" : "covered",
      count,
      minPerTopic,
      missing,
      missing > 0 ? "real questions required" : "",
    ]),
  );
}

const minPerDifficulty = report.minimumRequired?.minPerDifficulty ?? 0;
for (const d of [1, 2, 3, 4, 5, 6]) {
  const count = Number(report.questionsByDifficulty?.[d] ?? 0);
  const missing = Math.max(0, minPerDifficulty - count);
  lines.push(
    row([
      "difficulty_bucket",
      d,
      "question_bank_batch",
      missing > 0 ? "gap" : "covered",
      count,
      minPerDifficulty,
      missing,
      missing > 0 ? "real questions required" : "",
    ]),
  );
}

const totalQuestions = Number(
  Object.values(report.questionsByTopic ?? {}).reduce((a, b) => Number(a) + Number(b), 0),
);
const minTotal = report.minimumRequired?.totalQuestions ?? 0;
const totalMissing = Math.max(0, minTotal - totalQuestions);
lines.push(
  row([
    "global_bucket",
    "all_topics",
    "question_bank_batch",
    totalMissing > 0 ? "gap" : "covered",
    totalQuestions,
    minTotal,
    totalMissing,
    totalMissing > 0 ? "real questions required" : "",
  ]),
);

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(outputPath);
