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
const REPORTS_DIR = path.join(ROOT, "reports");
const JSON_OUT = path.join(REPORTS_DIR, "amirant-question-qa-report.json");
const CSV_OUT = path.join(REPORTS_DIR, "amirant-question-qa-report.csv");
const SUMMARY_CSV_OUT = path.join(REPORTS_DIR, "amirant-question-qa-summary.csv");
const PRIORITY_CSV_OUT = path.join(REPORTS_DIR, "amirant-question-qa-priority-top-50.csv");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function csvCell(v) {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(csvCell).join(",");
}

function normalizeText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\(תרגול וריאציה [^)]+\)/g, "")
    .replace(/[^a-zA-Z0-9\u0590-\u05ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return normalizeText(s)
    .split(" ")
    .filter(Boolean);
}

function jaccard(a, b) {
  const sa = new Set(tokens(a));
  const sb = new Set(tokens(b));
  if (!sa.size && !sb.size) return 1;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function containsHebrew(s) {
  return /[\u0590-\u05FF]/.test(String(s ?? ""));
}

function wordCount(s) {
  return tokens(s).length;
}

function addIssue(issues, type, severity, reason, suggestedFixDirection) {
  issues.push({
    type,
    severity,
    reason,
    suggestedFixDirection,
  });
}

function evaluateQuestion(q, stemFrequency) {
  const issues = [];
  const options = Array.isArray(q.options) ? q.options : [];
  const optionTexts = options.map((o) => String(o.label ?? ""));
  const optionNorm = optionTexts.map((x) => normalizeText(x));
  const uniqueOptionNorm = new Set(optionNorm);
  const correct = options.find((o) => o.id === q.correctOptionId);
  const qText = String(q.questionText ?? "");
  const explanation = String(q.explanation ?? "");
  const stem = normalizeText(qText);
  const diff = Number(q.difficultyLevel ?? 0);
  const topic = String(q.topic ?? "");
  const subtopic = String(q.subtopic ?? "");

  if (!qText || wordCount(qText) < 5) {
    addIssue(
      issues,
      "unclear_wording",
      "critical_issue",
      "Question wording is too short or missing.",
      "Rewrite the stem with clear context and a precise test objective.",
    );
  }

  if (containsHebrew(qText)) {
    addIssue(
      issues,
      "language_quality",
      "needs_review",
      "Question text contains Hebrew characters in an English assessment item.",
      "Keep stem and options in consistent exam language (English), move Hebrew to explanation only.",
    );
  }

  if (options.length !== 4) {
    addIssue(
      issues,
      "option_structure",
      "critical_issue",
      `Expected 4 options, found ${options.length}.`,
      "Ensure exactly 4 plausible options per question.",
    );
  }

  if (!correct) {
    addIssue(
      issues,
      "correct_answer_ambiguity",
      "critical_issue",
      "correctOptionId does not match any option.",
      "Set correctOptionId to one existing option id.",
    );
  }

  if (uniqueOptionNorm.size < optionNorm.length) {
    addIssue(
      issues,
      "duplicate_or_similar_options",
      "critical_issue",
      "At least two options are duplicated or nearly identical.",
      "Replace duplicate distractors with semantically distinct alternatives.",
    );
  }

  for (let i = 0; i < optionTexts.length; i++) {
    for (let j = i + 1; j < optionTexts.length; j++) {
      const sim = jaccard(optionTexts[i], optionTexts[j]);
      if (sim >= 0.9) {
        addIssue(
          issues,
          "duplicate_or_similar_options",
          "needs_review",
          `Options are overly similar (similarity=${sim.toFixed(2)}).`,
          "Differentiate distractors with clearer semantic contrast.",
        );
      }
    }
  }

  if (!explanation.trim()) {
    addIssue(
      issues,
      "missing_explanation",
      "critical_issue",
      "Explanation is missing.",
      "Add a full pedagogical explanation with why correct is right and why distractors are wrong.",
    );
  } else {
    const expWords = wordCount(explanation);
    if (expWords < 8) {
      addIssue(
        issues,
        "shallow_explanation",
        "needs_review",
        "Explanation is too short to teach reasoning.",
        "Expand explanation with rule/strategy and distractor elimination notes.",
      );
    }
    if (
      /imported from|generated-variant|תרגול וריאציה/i.test(explanation)
    ) {
      addIssue(
        issues,
        "shallow_explanation",
        "needs_review",
        "Explanation is template-like and not pedagogical.",
        "Replace template explanation with concept-based guidance and reasoning.",
      );
    }
  }

  const optionLengths = optionTexts.map((x) => wordCount(x)).filter((n) => n > 0);
  if (optionLengths.length >= 2) {
    const minLen = Math.min(...optionLengths);
    const maxLen = Math.max(...optionLengths);
    if (minLen > 0 && maxLen / minLen >= 3.2) {
      addIssue(
        issues,
        "too_easy_to_eliminate",
        "needs_review",
        "Option length distribution is extreme; elimination may be trivial.",
        "Balance option lengths and keep all options similarly plausible.",
      );
    }
  }

  if (
    topic === "sentence_completion" &&
    !/__+/.test(qText) &&
    !/choose|complete/i.test(qText)
  ) {
    addIssue(
      issues,
      "topic_subtopic_mismatch",
      "needs_review",
      "Sentence-completion item lacks explicit blank/completion signal.",
      "Use clear cloze format with one blank and context sentence.",
    );
  }

  if (topic === "rephrasing" && !/original:/i.test(qText)) {
    addIssue(
      issues,
      "topic_subtopic_mismatch",
      "needs_review",
      "Rephrasing item does not include an explicit original sentence marker.",
      "Add 'Original:' source sentence then options with equivalent meaning.",
    );
  }

  // `vocab-<kind>-<difficulty>` היא הקונבנציה שהרנטיים משתמש בה לסינון סוגי
  // מילים (filterBankByTopicsAndVocabMode) — תקפה לנושא vocabulary
  const subtopicAligned =
    subtopic.startsWith(topic) ||
    (topic === "vocabulary" && subtopic.startsWith("vocab-"));
  if (subtopic && topic && !subtopicAligned) {
    addIssue(
      issues,
      "topic_subtopic_mismatch",
      "needs_review",
      "Subtopic naming is not aligned with topic naming convention.",
      "Normalize subtopic prefix to match topic for cleaner analytics and QA.",
    );
  }

  const wc = wordCount(qText);
  if (diff <= 2 && wc > 26) {
    addIssue(
      issues,
      "difficulty_mismatch",
      "needs_review",
      "Very long stem for low difficulty item.",
      "Shorten text or increase difficulty if complexity is intentional.",
    );
  }
  if (diff >= 5 && wc < 7) {
    addIssue(
      issues,
      "difficulty_mismatch",
      "needs_review",
      "Very short stem for high difficulty item.",
      "Increase linguistic nuance or lower difficulty level.",
    );
  }

  // פתיחי הבנת-הנקרא קנוניים חוזרים בין קטעים במבחן האמיתי — לא שיבוט תבניות
  const CANONICAL_COMPREHENSION_STEMS = new Set([
    "what is the main idea of the passage",
    "what is the main idea of this passage",
    "what is the main purpose of the passage",
  ]);
  if (stemFrequency.get(stem) >= 3 && !CANONICAL_COMPREHENSION_STEMS.has(stem)) {
    const freq = stemFrequency.get(stem);
    addIssue(
      issues,
      "repeated_template_similarity",
      freq >= 8 ? "critical_issue" : "needs_review",
      `Stem pattern repeats ${freq} times across bank.`,
      "Create new stems and contexts; avoid clone-template variants.",
    );
  }

  if (
    /-gen-d\d-/.test(String(q.questionId ?? "")) ||
    /תרגול וריאציה/i.test(qText)
  ) {
    addIssue(
      issues,
      "repeated_template_similarity",
      "critical_issue",
      "Generated variant marker detected in live question text/id.",
      "Replace with original authored item and remove generator markers.",
    );
  }

  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical_issue") score -= 28;
    else score -= 12;
  }
  score = Math.max(0, score);

  let qaStatus = "pass";
  const hasCritical = issues.some((i) => i.severity === "critical_issue");
  if (hasCritical || score < 55) qaStatus = "critical_issue";
  else if (issues.length > 0 || score < 80) qaStatus = "needs_review";

  return {
    questionId: q.questionId,
    topic: q.topic,
    subtopic: q.subtopic,
    difficultyLevel: q.difficultyLevel,
    qaStatus,
    score,
    issues,
  };
}

function main() {
  ensureDir(REPORTS_DIR);
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const stemFrequency = new Map();
  for (const q of questions) {
    const stem = normalizeText(q.questionText);
    stemFrequency.set(stem, (stemFrequency.get(stem) ?? 0) + 1);
  }

  const evaluations = questions.map((q) => evaluateQuestion(q, stemFrequency));
  const flagged = evaluations.filter((x) => x.qaStatus !== "pass");

  const summaryByTopic = {};
  const summaryByDifficulty = {};
  const issueTypeCounts = {};
  for (const row of evaluations) {
    summaryByTopic[row.topic] ??= {
      total: 0,
      pass: 0,
      needs_review: 0,
      critical_issue: 0,
      avgScore: 0,
    };
    summaryByTopic[row.topic].total += 1;
    summaryByTopic[row.topic][row.qaStatus] += 1;
    summaryByTopic[row.topic].avgScore += row.score;

    const d = String(row.difficultyLevel);
    summaryByDifficulty[d] ??= {
      total: 0,
      pass: 0,
      needs_review: 0,
      critical_issue: 0,
      avgScore: 0,
    };
    summaryByDifficulty[d].total += 1;
    summaryByDifficulty[d][row.qaStatus] += 1;
    summaryByDifficulty[d].avgScore += row.score;

    for (const issue of row.issues) {
      issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] ?? 0) + 1;
    }
  }

  for (const key of Object.keys(summaryByTopic)) {
    const entry = summaryByTopic[key];
    entry.avgScore = Number((entry.avgScore / Math.max(1, entry.total)).toFixed(2));
  }
  for (const key of Object.keys(summaryByDifficulty)) {
    const entry = summaryByDifficulty[key];
    entry.avgScore = Number((entry.avgScore / Math.max(1, entry.total)).toFixed(2));
  }

  const priorityFirst50 = [...flagged]
    .sort((a, b) => {
      const severityRank = (x) => (x.qaStatus === "critical_issue" ? 2 : x.qaStatus === "needs_review" ? 1 : 0);
      if (severityRank(b) !== severityRank(a)) return severityRank(b) - severityRank(a);
      if (a.score !== b.score) return a.score - b.score;
      return b.issues.length - a.issues.length;
    })
    .slice(0, 50);

  const report = {
    generatedAt: new Date().toISOString(),
    totalQuestions: evaluations.length,
    counts: {
      pass: evaluations.filter((x) => x.qaStatus === "pass").length,
      needs_review: evaluations.filter((x) => x.qaStatus === "needs_review").length,
      critical_issue: evaluations.filter((x) => x.qaStatus === "critical_issue").length,
      flagged: flagged.length,
    },
    summaryByTopic,
    summaryByDifficulty,
    issueTypeCounts,
    flaggedQuestions: flagged,
    priorityFirst50,
  };

  fs.writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`);

  const csvLines = [
    csvRow([
      "questionId",
      "topic",
      "subtopic",
      "difficultyLevel",
      "qaStatus",
      "score",
      "issueType",
      "severity",
      "reason",
      "suggestedFixDirection",
    ]),
  ];
  for (const q of flagged) {
    for (const issue of q.issues) {
      csvLines.push(
        csvRow([
          q.questionId,
          q.topic,
          q.subtopic,
          q.difficultyLevel,
          q.qaStatus,
          q.score,
          issue.type,
          issue.severity,
          issue.reason,
          issue.suggestedFixDirection,
        ]),
      );
    }
  }
  fs.writeFileSync(CSV_OUT, `${csvLines.join("\n")}\n`);

  const summaryLines = [
    csvRow(["dimension", "bucket", "total", "pass", "needs_review", "critical_issue", "avgScore"]),
  ];
  for (const [topic, s] of Object.entries(summaryByTopic)) {
    summaryLines.push(
      csvRow(["topic", topic, s.total, s.pass, s.needs_review, s.critical_issue, s.avgScore]),
    );
  }
  for (const [d, s] of Object.entries(summaryByDifficulty)) {
    summaryLines.push(
      csvRow(["difficulty", d, s.total, s.pass, s.needs_review, s.critical_issue, s.avgScore]),
    );
  }
  fs.writeFileSync(SUMMARY_CSV_OUT, `${summaryLines.join("\n")}\n`);

  const topLines = [
    csvRow([
      "rank",
      "questionId",
      "topic",
      "subtopic",
      "difficultyLevel",
      "qaStatus",
      "score",
      "issueCount",
      "topIssueTypes",
    ]),
  ];
  priorityFirst50.forEach((q, i) => {
    topLines.push(
      csvRow([
        i + 1,
        q.questionId,
        q.topic,
        q.subtopic,
        q.difficultyLevel,
        q.qaStatus,
        q.score,
        q.issues.length,
        Array.from(new Set(q.issues.map((x) => x.type))).slice(0, 4).join("|"),
      ]),
    );
  });
  fs.writeFileSync(PRIORITY_CSV_OUT, `${topLines.join("\n")}\n`);

  console.log(
    JSON.stringify(
      {
        jsonReport: JSON_OUT,
        csvReport: CSV_OUT,
        summaryCsv: SUMMARY_CSV_OUT,
        priorityCsv: PRIORITY_CSV_OUT,
        totalQuestions: report.totalQuestions,
        counts: report.counts,
      },
      null,
      2,
    ),
  );
}

main();
