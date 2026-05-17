import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QUIZ_DIR = path.join(
  ROOT,
  "content",
  "amirnet-course",
  "04_sentence_completion",
  "practice_quizzes",
);
const QUESTIONS_PATH = path.join(
  ROOT,
  "content",
  "amirant-import",
  "source",
  "questions.json",
);
const REPORT_PATH = path.join(
  ROOT,
  "reports",
  "amirant-real-sc-import-report.json",
);

function readMarkdownFiles() {
  const names = fs
    .readdirSync(QUIZ_DIR)
    .filter(
      (name) =>
        /^sc_quiz_.*\.md$/i.test(name) || /^SAMPLE_sc_quiz_.*\.md$/i.test(name),
    )
    .sort((a, b) => a.localeCompare(b));
  return names.map((name) => ({
    fileName: name,
    fullPath: path.join(QUIZ_DIR, name),
    markdown: fs.readFileSync(path.join(QUIZ_DIR, name), "utf8"),
  }));
}

function fileSlug(fileName) {
  return fileName.replace(/\.md$/i, "").toLowerCase();
}

function normalizeLine(value) {
  return String(value ?? "").replace(/\r/g, "").trim();
}

function normalizeSpaces(value) {
  return String(value ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function parseBaseDifficulty(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("easy")) return "easy";
  if (lower.includes("intermediate")) return "intermediate";
  if (lower.includes("hard")) return "hard";
  if (lower.includes("mixed")) return "mixed";
  return "mixed";
}

function parseQuestionsPart(markdown) {
  const lines = markdown.split("\n");
  const questions = [];
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    if (!current.questionNumber || !current.questionText || current.options.length !== 4) {
      current = null;
      return;
    }
    questions.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = normalizeLine(raw);

    if (/^##\s+Part\s+2:/i.test(line)) {
      flushCurrent();
      break;
    }

    const questionMatch = line.match(/^###\s+Question\s+(\d+)(.*)$/i);
    if (questionMatch) {
      flushCurrent();
      current = {
        questionNumber: Number(questionMatch[1]),
        headingSuffix: normalizeSpaces(questionMatch[2] ?? ""),
        questionText: "",
        options: [],
      };
      continue;
    }

    if (!current) continue;

    const optionMatch = line.match(/^\(([A-D])\)\s+(.+)$/);
    if (optionMatch) {
      current.options.push({
        id: optionMatch[1].toLowerCase(),
        label: normalizeSpaces(optionMatch[2]),
      });
      continue;
    }

    if (line.startsWith("---") || line.length === 0) continue;

    if (!current.questionText) {
      current.questionText = normalizeSpaces(line);
    } else {
      current.questionText = normalizeSpaces(`${current.questionText} ${line}`);
    }
  }

  flushCurrent();
  return questions;
}

function parseAnswersAndExplanations(markdown) {
  const lines = markdown.split("\n");
  const out = new Map();
  let currentQuestion = null;
  let currentAnswer = null;
  let explanationLines = [];

  const flush = () => {
    if (!currentQuestion || !currentAnswer) return;
    const explanation = explanationLines
      .map((line) => line.replace(/\s+$/g, ""))
      .join("\n")
      .trim();
    out.set(currentQuestion, {
      correctOptionId: currentAnswer,
      explanation,
    });
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = normalizeLine(lines[i]);

    if (/^##\s+Part\s+3:/i.test(line) || /^##\s+🎯/i.test(line)) {
      flush();
      break;
    }

    const answerMatch = line.match(
      /^###\s+.*Question\s+(\d+)\s+[—–-]\s+(?:Correct\s+)?Answer:\s*✅?\s*\*?\*?\(([A-D])\)[^*]*\*?\*?.*$/i,
    );
    if (answerMatch) {
      flush();
      currentQuestion = Number(answerMatch[1]);
      currentAnswer = answerMatch[2].toLowerCase();
      explanationLines = [];
      continue;
    }

    if (!currentQuestion) continue;

    const nextQuestion = line.match(
      /^###\s+.*Question\s+\d+\s+[—–-]\s+(?:Correct\s+)?Answer:/i,
    );
    if (nextQuestion) continue;

    explanationLines.push(lines[i]);
  }

  return out;
}

function difficultyFromLabel(levelLabel, indexByLabel) {
  const pick = (range) => {
    const idx = indexByLabel[range] ?? 0;
    indexByLabel[range] = idx + 1;
    if (range === "easy") return idx % 2 === 0 ? 1 : 2;
    if (range === "intermediate") return idx % 2 === 0 ? 3 : 4;
    if (range === "hard") return idx % 2 === 0 ? 5 : 6;
    return (idx % 6) + 1;
  };
  return pick(levelLabel);
}

function inferMixedQuestionLevel(headingSuffix, mixedIndex) {
  const s = headingSuffix.toLowerCase();
  if (s.includes("easy")) return "easy";
  if (s.includes("intermediate")) return "intermediate";
  if (s.includes("hard")) return "hard";
  const idx = mixedIndex.value;
  mixedIndex.value += 1;
  const fallback = [1, 2, 3, 4, 5, 6][idx % 6];
  if (fallback <= 2) return "easy";
  if (fallback <= 4) return "intermediate";
  return "hard";
}

function buildRealSentenceCompletionQuestions() {
  const files = readMarkdownFiles();
  const all = [];
  const difficultyCounters = { easy: 0, intermediate: 0, hard: 0, mixed: 0 };
  const mixedIndex = { value: 0 };
  const perFile = [];

  for (const file of files) {
    const slug = fileSlug(file.fileName);
    const baseDifficulty = parseBaseDifficulty(file.fileName);
    const parsedQuestions = parseQuestionsPart(file.markdown);
    const answerMap = parseAnswersAndExplanations(file.markdown);
    let importedFromFile = 0;
    const labelCounters = { easy: 0, intermediate: 0, hard: 0, mixed: 0 };

    for (const q of parsedQuestions) {
      const answer = answerMap.get(q.questionNumber);
      if (!answer?.correctOptionId) continue;

      let levelLabel = baseDifficulty;
      if (baseDifficulty === "mixed") {
        levelLabel = inferMixedQuestionLevel(q.headingSuffix, mixedIndex);
      }
      const difficultyLevel = difficultyFromLabel(levelLabel, labelCounters);
      difficultyCounters[levelLabel] += 1;

      all.push({
        questionId: `${slug}-q${q.questionNumber}`,
        topic: "sentence_completion",
        subtopic: `sentence_completion-${slug}`,
        difficultyLevel,
        questionText: q.questionText,
        options: q.options,
        correctOptionId: answer.correctOptionId,
        explanation: answer.explanation || `Imported from ${file.fileName}`,
        distractorExplanations: {},
        estimatedTimeSec: difficultyLevel >= 5 ? 90 : difficultyLevel >= 3 ? 75 : 60,
        tags: [
          "imported",
          "real_source_markdown",
          "sentence_completion_real",
          slug,
        ],
        sourceFile: file.fileName,
      });
      importedFromFile += 1;
    }
    perFile.push({
      fileName: file.fileName,
      parsedQuestions: parsedQuestions.length,
      parsedAnswers: answerMap.size,
      importedQuestions: importedFromFile,
    });
  }

  return { questions: all, difficultyCounters, perFile };
}

function isGeneratedQuestion(question) {
  const questionId = String(question.questionId ?? "");
  const questionText = String(question.questionText ?? "");
  const explanation = String(question.explanation ?? "");
  const tags = Array.isArray(question.tags) ? question.tags.map((t) => String(t)) : [];
  return (
    /-gen-d\d-/i.test(questionId) ||
    /generated_variant/i.test(questionText) ||
    /generated-variant/i.test(explanation) ||
    /\(תרגול וריאציה/i.test(questionText) ||
    tags.some((tag) => /generated_variant/i.test(tag))
  );
}

function markAsDemoOnly(question) {
  const tags = Array.isArray(question.tags) ? question.tags.map((t) => String(t)) : [];
  return {
    ...question,
    demo_only: true,
    tags: Array.from(new Set([...tags, "demo_only", "generated_legacy"])),
  };
}

function mergeQuestions(existing, realSentenceCompletionQuestions) {
  const realById = new Map(
    realSentenceCompletionQuestions.map((q) => [String(q.questionId), q]),
  );
  const next = [];
  let replaced = 0;
  let markedDemoOnly = 0;
  let untouched = 0;

  for (const question of existing) {
    const id = String(question.questionId ?? "");
    const replacement = realById.get(id);
    if (replacement) {
      next.push(replacement);
      realById.delete(id);
      replaced += 1;
      continue;
    }

    if (isGeneratedQuestion(question)) {
      next.push(markAsDemoOnly(question));
      markedDemoOnly += 1;
      continue;
    }

    next.push(question);
    untouched += 1;
  }

  for (const remaining of realById.values()) {
    next.push(remaining);
  }

  return {
    questions: next,
    stats: {
      replacedById: replaced,
      addedNewRealQuestions: realById.size,
      markedGeneratedDemoOnly: markedDemoOnly,
      untouched,
    },
  };
}

function countByDifficulty(questions, topicFilter) {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const row of questions) {
    if (topicFilter && row.topic !== topicFilter) continue;
    const d = Number(row.difficultyLevel);
    if (d >= 1 && d <= 6) out[d] += 1;
  }
  return out;
}

function main() {
  const { questions: realScQuestions, perFile } =
    buildRealSentenceCompletionQuestions();
  const existing = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const merged = mergeQuestions(existing, realScQuestions);
  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(merged.questions, null, 2)}\n`);

  const report = {
    generatedAt: new Date().toISOString(),
    importedRealSentenceCompletionQuestions: realScQuestions.length,
    importedByFile: perFile,
    mergeStats: merged.stats,
    sentenceCompletionCoverageByDifficulty: countByDifficulty(
      merged.questions,
      "sentence_completion",
    ),
    totalCoverageByDifficulty: countByDifficulty(merged.questions),
  };
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify(report, null, 2));
}

main();
