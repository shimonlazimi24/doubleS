import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const QUESTIONS_PATH = path.join(
  ROOT,
  "content",
  "amirant-import",
  "source",
  "questions.json",
);
const QA_REPORT_PATH = path.join(
  ROOT,
  "reports",
  "amirant-question-qa-report.json",
);
const FIX_PLAN_PATH = path.join(
  ROOT,
  "reports",
  "amirant-content-critical-fix-plan.md",
);

const ACCEPTANCE = {
  criticalIssueMax: 0,
  passRateMin: 0.85,
  repeatedTemplateMax: 0,
  /** χ²(df=3) critical value at p=0.05 — above this the answer key is not uniform. */
  keyBalanceChiSquareMax: 7.81,
  /** Share of items whose correct answer is also the longest option (chance = 0.25). */
  longestOptionRateMax: 0.35,
};

/**
 * The length gate is reported but not blocking yet: re-seating the options fixed
 * the *position* bias, while "the longest option is the correct one" is a
 * property of how the distractors are written. It is closed by rewriting the
 * short, obviously-wrong distractors in restatement and reading comprehension —
 * authoring work, not a script. Flip this to true once that pass lands so the
 * bias cannot creep back.
 */
const LONGEST_OPTION_GATE_BLOCKING = false;

const OPTION_IDS = ["a", "b", "c", "d"];

/** A stem is student-facing prose: markdown headings, emoji markers and line
 *  breaks in it are import residue, not content. */
function stemContamination(text) {
  const s = String(text ?? "");
  if (/(?:^|\s)#{1,6}\s/.test(s)) return "markdown_heading";
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s)) return "emoji_marker";
  if (/\((?:Easy|Intermediate|Hard|Medium)\)/i.test(s)) return "difficulty_leak";
  if (/\*\*/.test(s)) return "bold_marker";
  if (/\n/.test(s)) return "line_break";
  return null;
}

/** The item's shape must agree with its topic, or every downstream statistic
 *  (weak areas, recommendations, section filtering) is attributed wrongly. */
function topicShapeMismatch(q) {
  const topic = String(q.topic ?? "");
  if (q.passageId && topic !== "reading_comprehension") {
    return `${q.questionId}: has passageId but topic=${topic}`;
  }
  if (/^\s*Original:/i.test(String(q.questionText ?? "")) && topic !== "rephrasing") {
    return `${q.questionId}: "Original:" stem but topic=${topic}`;
  }
  if (!q.passageId && topic === "reading_comprehension") {
    return `${q.questionId}: reading_comprehension without a passage`;
  }
  return null;
}

function keyBalanceChiSquare(questions) {
  const counts = Object.fromEntries(OPTION_IDS.map((id) => [id, 0]));
  for (const q of questions) {
    if (counts[q.correctOptionId] !== undefined) counts[q.correctOptionId] += 1;
  }
  const expected = questions.length / OPTION_IDS.length;
  const chiSquare = expected
    ? OPTION_IDS.reduce((sum, id) => sum + (counts[id] - expected) ** 2 / expected, 0)
    : 0;
  return { counts, chiSquare: Number(chiSquare.toFixed(2)) };
}

function longestOptionRates(questions) {
  const byTopic = {};
  for (const q of questions) {
    const options = q.options ?? [];
    const correct = options.find((o) => o.id === q.correctOptionId);
    if (!correct || options.length === 0) continue;
    const longest = Math.max(...options.map((o) => String(o.label ?? "").length));
    byTopic[q.topic] ??= { n: 0, longest: 0 };
    byTopic[q.topic].n += 1;
    if (String(correct.label ?? "").length === longest) byTopic[q.topic].longest += 1;
  }
  return Object.fromEntries(
    Object.entries(byTopic).map(([topic, v]) => [
      topic,
      { n: v.n, rate: Number((v.longest / v.n).toFixed(3)) },
    ]),
  );
}

function run(command, args) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function optionNorm(s) {
  // כולל עברית - בלעדיה כל אופציה עברית מתנרמלת ל-"" וכל שאלת אוצר מילים
  // נספרת כ"אופציות כפולות" (false positive שהפיל את שער ה-CI)
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFixPlan(report) {
  const critical = (report.priorityFirst50 ?? []).filter(
    (row) => row.qaStatus === "critical_issue",
  );
  const lines = [
    "# Amirant Critical Fix Plan (Batch 1)",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    `Total critical in priority slice: ${critical.length}`,
    "",
    "## First 50 priority items",
    "",
    "| # | questionId | topic | difficulty | issues | recommended fix |",
    "|---|---|---|---:|---|---|",
  ];

  critical.slice(0, 50).forEach((row, i) => {
    const issueNames = row.issues.map((x) => x.type).join(", ");
    const fix = row.issues
      .slice(0, 2)
      .map((x) => x.suggestedFixDirection)
      .join(" / ")
      .replace(/\|/g, "/");
    lines.push(
      `| ${i + 1} | ${row.questionId} | ${row.topic} | ${row.difficultyLevel} | ${issueNames} | ${fix} |`,
    );
  });
  lines.push("", "## Batch strategy", "");
  lines.push(
    "1. Replace generated/template stems with authored stems per topic.",
    "2. Rewrite explanations to concept-based pedagogical form (why correct + why distractors are wrong).",
    "3. Rebuild distractor sets for semantic plausibility and option distinctness.",
    "4. Re-run `npm run qa:amirant-content` until release gate passes.",
    "",
  );

  fs.writeFileSync(FIX_PLAN_PATH, `${lines.join("\n")}\n`);
}

function main() {
  run("node", ["scripts/amirant-question-pedagogical-qa.mjs"]);

  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const report = JSON.parse(fs.readFileSync(QA_REPORT_PATH, "utf8"));
  buildFixPlan(report);

  let missingExplanations = 0;
  let duplicateOptions = 0;
  let generatedQuestionCount = 0;
  for (const q of questions) {
    if (!String(q.explanation ?? "").trim()) missingExplanations += 1;
    const labels = (q.options ?? []).map((x) => optionNorm(x.label));
    if (new Set(labels).size !== labels.length) duplicateOptions += 1;
    if (
      /-gen-d\d-/i.test(String(q.questionId ?? "")) ||
      /generated-bulk/i.test(String(q.subtopic ?? "")) ||
      (Array.isArray(q.tags) &&
        q.tags.some((t) => /generated|demo/i.test(String(t))))
    ) {
      generatedQuestionCount += 1;
    }
  }

  const totalQuestions = Number(report.totalQuestions ?? 0);
  const passCount = Number(report.counts?.pass ?? 0);
  const criticalCount = Number(report.counts?.critical_issue ?? 0);
  const repeatedTemplateCount = Number(
    report.issueTypeCounts?.repeated_template_similarity ?? 0,
  );
  const passRate = totalQuestions > 0 ? passCount / totalQuestions : 0;

  const contaminatedStems = questions
    .map((q) => {
      const kind = stemContamination(q.questionText);
      return kind ? `${q.questionId}: ${kind}` : null;
    })
    .filter(Boolean);
  const shapeMismatches = questions.map(topicShapeMismatch).filter(Boolean);
  const keyBalance = keyBalanceChiSquare(questions);
  const longestRates = longestOptionRates(questions);
  const worstLongestTopic = Object.entries(longestRates).sort((a, b) => b[1].rate - a[1].rate)[0];

  const gates = [
    {
      name: "critical_issue == 0",
      pass: criticalCount <= ACCEPTANCE.criticalIssueMax,
      actual: criticalCount,
    },
    {
      name: "pass >= 85%",
      pass: passRate >= ACCEPTANCE.passRateMin,
      actual: `${(passRate * 100).toFixed(2)}%`,
    },
    {
      name: "missing explanations == 0",
      pass: missingExplanations === 0,
      actual: missingExplanations,
    },
    {
      name: "duplicate options == 0",
      pass: duplicateOptions === 0,
      actual: duplicateOptions,
    },
    {
      name: "repeated-template clusters == 0",
      pass: repeatedTemplateCount <= ACCEPTANCE.repeatedTemplateMax,
      actual: repeatedTemplateCount,
    },
    {
      name: `answer-key balance (chi-square <= ${ACCEPTANCE.keyBalanceChiSquareMax})`,
      pass: keyBalance.chiSquare <= ACCEPTANCE.keyBalanceChiSquareMax,
      actual: `chi2=${keyBalance.chiSquare} ${JSON.stringify(keyBalance.counts)}`,
    },
    {
      name: "contaminated stems == 0",
      pass: contaminatedStems.length === 0,
      actual: contaminatedStems.length,
      detail: contaminatedStems.slice(0, 10),
    },
    {
      name: "topic matches item shape",
      pass: shapeMismatches.length === 0,
      actual: shapeMismatches.length,
      detail: shapeMismatches.slice(0, 10),
    },
    {
      name: `longest option is correct <= ${ACCEPTANCE.longestOptionRateMax * 100}% per topic`,
      pass: !worstLongestTopic || worstLongestTopic[1].rate <= ACCEPTANCE.longestOptionRateMax,
      actual: JSON.stringify(longestRates),
      blocking: LONGEST_OPTION_GATE_BLOCKING,
    },
  ];

  const output = {
    totalQuestions,
    passCount,
    criticalCount,
    passRate,
    repeatedTemplateCount,
    generatedQuestionCount,
    generatedContentMode:
      generatedQuestionCount > 0 ? "demo_generated_present" : "fully_authored",
    fixPlan: path.relative(ROOT, FIX_PLAN_PATH),
    gates,
  };

  console.log(JSON.stringify(output, null, 2));

  const failed = gates.filter((g) => !g.pass);
  const blocking = failed.filter((g) => g.blocking !== false);
  const tracked = failed.filter((g) => g.blocking === false);

  for (const gate of tracked) {
    console.error(`QA gate tracked (not blocking): ${gate.name} → ${gate.actual}`);
  }

  if (blocking.length > 0) {
    console.error(
      `QA release gate failed (${blocking.length} checks failed). See ${path.relative(
        ROOT,
        FIX_PLAN_PATH,
      )}`,
    );
    process.exit(2);
  }
}

main();
