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
};

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
  if (failed.length > 0) {
    console.error(
      `QA release gate failed (${failed.length} checks failed). See ${path.relative(
        ROOT,
        FIX_PLAN_PATH,
      )}`,
    );
    process.exit(2);
  }
}

main();
