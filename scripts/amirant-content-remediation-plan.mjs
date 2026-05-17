import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QA_JSON_PATH = path.join(ROOT, "reports", "amirant-question-qa-report.json");
const SUMMARY_CSV_PATH = path.join(ROOT, "reports", "amirant-question-qa-summary.csv");
const PRIORITY_CSV_PATH = path.join(ROOT, "reports", "amirant-question-qa-priority-top-50.csv");
const COVERAGE_CSV_PATH = path.join(ROOT, "reports", "amirant-coverage-matrix.csv");
const OUT_MD_PATH = path.join(ROOT, "reports", "amirant-content-remediation-plan.md");
const OUT_JSON_PATH = path.join(ROOT, "reports", "amirant-content-remediation-plan.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseCsv(text) {
  const rows = [];
  const lines = text.trim().split("\n");
  const header = splitCsvLine(lines[0]).map(unquote);
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]).map(unquote);
    const row = {};
    for (let j = 0; j < header.length; j++) row[header[j]] = cols[j] ?? "";
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQ = !inQ;
      }
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function unquote(x) {
  return String(x ?? "").trim();
}

function inc(map, key, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function main() {
  const qa = readJson(QA_JSON_PATH);
  const summaryRows = parseCsv(fs.readFileSync(SUMMARY_CSV_PATH, "utf8"));
  const priorityRows = parseCsv(fs.readFileSync(PRIORITY_CSV_PATH, "utf8"));
  const coverageRows = parseCsv(fs.readFileSync(COVERAGE_CSV_PATH, "utf8"));

  const criticalRows = (qa.flaggedQuestions ?? []).filter(
    (q) => q.qaStatus === "critical_issue",
  );

  const byIssueType = new Map();
  const byTopic = new Map();
  const byDifficulty = new Map();
  const repeatedTemplateCluster = new Map();

  for (const q of criticalRows) {
    inc(byTopic, String(q.topic));
    inc(byDifficulty, String(q.difficultyLevel));
    const repeatedIssues = (q.issues ?? []).filter(
      (x) => x.type === "repeated_template_similarity",
    );
    if (repeatedIssues.length > 0) {
      const clusterKey = String(q.subtopic ?? q.topic ?? "unknown");
      inc(repeatedTemplateCluster, clusterKey);
    }
    for (const issue of q.issues ?? []) {
      inc(byIssueType, String(issue.type));
    }
  }

  const criticalSorted = [...criticalRows].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return (b.issues?.length ?? 0) - (a.issues?.length ?? 0);
  });
  const batch1 = criticalSorted.slice(0, 50).map((x) => x.questionId);
  const batch2 = criticalSorted.slice(50, 100).map((x) => x.questionId);
  const batch3 = criticalSorted.slice(100).map((x) => x.questionId);

  const topIssueTypes = [...byIssueType.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topClusters = [...repeatedTemplateCluster.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const out = {
    generatedAt: new Date().toISOString(),
    loadedReports: {
      summaryCsv: path.relative(ROOT, SUMMARY_CSV_PATH),
      priorityCsv: path.relative(ROOT, PRIORITY_CSV_PATH),
      coverageCsv: path.relative(ROOT, COVERAGE_CSV_PATH),
      qaJson: path.relative(ROOT, QA_JSON_PATH),
    },
    current: {
      totalQuestions: qa.totalQuestions ?? 0,
      criticalIssue: qa.counts?.critical_issue ?? 0,
      needsReview: qa.counts?.needs_review ?? 0,
      pass: qa.counts?.pass ?? 0,
    },
    grouping: {
      byIssueType: Object.fromEntries(
        [...byIssueType.entries()].sort((a, b) => b[1] - a[1]),
      ),
      byTopic: Object.fromEntries(
        [...byTopic.entries()].sort((a, b) => b[1] - a[1]),
      ),
      byDifficulty: Object.fromEntries(
        [...byDifficulty.entries()].sort((a, b) => Number(a[0]) - Number(b[0])),
      ),
      repeatedTemplateCluster: Object.fromEntries(
        [...repeatedTemplateCluster.entries()].sort((a, b) => b[1] - a[1]),
      ),
      topIssueTypes,
      topClusters,
    },
    batches: {
      batch1: {
        size: batch1.length,
        ids: batch1,
      },
      batch2: {
        size: batch2.length,
        ids: batch2,
      },
      batch3: {
        size: batch3.length,
        ids: batch3,
      },
    },
    references: {
      summaryRowsLoaded: summaryRows.length,
      priorityRowsLoaded: priorityRows.length,
      coverageRowsLoaded: coverageRows.length,
    },
  };

  fs.writeFileSync(OUT_JSON_PATH, `${JSON.stringify(out, null, 2)}\n`);

  const md = [
    "# Amirant Content Remediation Plan",
    "",
    `Generated at: ${out.generatedAt}`,
    "",
    "## Current blockers",
    "",
    `- critical_issue: ${out.current.criticalIssue}`,
    `- needs_review: ${out.current.needsReview}`,
    `- pass: ${out.current.pass}`,
    "",
    "## Critical grouping",
    "",
    "### By issue type",
    ...topIssueTypes.map(([k, v]) => `- ${k}: ${v}`),
    "",
    "### By topic",
    ...[...byTopic.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- ${k}: ${v}`),
    "",
    "### By difficulty",
    ...[...byDifficulty.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => `- ${k}: ${v}`),
    "",
    "### Repeated-template clusters (top)",
    ...topClusters.map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Batch plan",
    "",
    `- Batch 1 (top 50): ${batch1.length} questions`,
    `- Batch 2 (next 50): ${batch2.length} questions`,
    `- Batch 3 (remaining): ${batch3.length} questions`,
    "",
    "Batch remediation order:",
    "1. Remove generated/template markers from IDs/text/tags where they trigger critical flags.",
    "2. Rewrite stems with topic-correct format and stronger distractors.",
    "3. Upgrade explanation quality to pedagogical reasoning.",
    "4. Re-run QA gate after each batch.",
    "",
  ].join("\n");

  fs.writeFileSync(OUT_MD_PATH, `${md}\n`);
  console.log(
    JSON.stringify(
      {
        planJson: path.relative(ROOT, OUT_JSON_PATH),
        planMarkdown: path.relative(ROOT, OUT_MD_PATH),
        criticalIssue: out.current.criticalIssue,
        batch1: batch1.length,
        batch2: batch2.length,
        batch3: batch3.length,
      },
      null,
      2,
    ),
  );
}

main();
