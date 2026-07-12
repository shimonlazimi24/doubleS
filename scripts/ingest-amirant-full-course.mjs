import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const COURSE_ROOT = path.join(ROOT, "content", "amirnet-course");
const OUTPUT_ROOT = path.join(ROOT, "content", "amirant-import", "source");
const REPORT_PATH = path.join(ROOT, "reports", "amirant-full-ingestion-report.json");

const TARGET_FOLDERS = [
  "03_vocabulary",
  "04_sentence_completion",
  "05_restatement",
  "06_reading_comprehension",
  "08_full_simulations",
];

const TOPIC_BY_FOLDER = {
  "03_vocabulary": "vocabulary",
  "04_sentence_completion": "sentence_completion",
  "05_restatement": "rephrasing",
  "06_reading_comprehension": "reading_comprehension",
  "08_full_simulations": "simulation",
};

const MODULE_BY_TOPIC = {
  vocabulary: "vocabulary",
  sentence_completion: "sentence-completion",
  rephrasing: "sentence-rephrasing",
  reading_comprehension: "reading-comprehension",
};

const SUBTOPIC_RULES = {
  sentence_completion: [
    { key: "despite", slug: "contrast-linkers" },
    { key: "although", slug: "contrast-linkers" },
    { key: "because", slug: "causality-linkers" },
    { key: "unless", slug: "conditional-logic" },
    { key: "if ", slug: "conditional-logic" },
    { key: "had ", slug: "conditional-logic" },
    { key: "passive", slug: "passive-voice" },
    { key: "turn off", slug: "phrasal-verbs" },
    { key: "collocation", slug: "collocations" },
    { key: "preposition", slug: "prepositions" },
  ],
  rephrasing: [
    { key: "original:", slug: "meaning-preservation" },
    { key: "had ", slug: "inversion-conditionals" },
    { key: "not only", slug: "inversion-emphasis" },
    { key: "were it not", slug: "conditional-forms" },
    { key: "little did", slug: "inversion-emphasis" },
    { key: "no sooner", slug: "time-inversion" },
  ],
  reading_comprehension: [
    { key: "main idea", slug: "main-idea" },
    { key: "according to the passage", slug: "detail-retrieval" },
    { key: "in paragraph", slug: "vocabulary-in-context" },
    { key: "inferred", slug: "inference" },
    { key: "infer", slug: "inference" },
    { key: "author", slug: "author-attitude" },
  ],
  vocabulary: [
    { key: "definition:", slug: "word-meaning" },
    { key: "synonyms", slug: "synonyms-antonyms" },
    { key: "antonyms", slug: "synonyms-antonyms" },
    { key: "phrasal", slug: "phrasal-verbs" },
    { key: "connective", slug: "connectives" },
  ],
};

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMd(line) {
  return String(line ?? "")
    .replace(/`+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fileDifficultyLabel(filePath) {
  const x = filePath.toLowerCase();
  if (x.includes("easy")) return "easy";
  if (x.includes("intermediate")) return "intermediate";
  if (x.includes("hard")) return "hard";
  if (x.includes("mixed")) return "mixed";
  if (x.includes("baseline")) return "intermediate";
  if (x.includes("warmup")) return "intermediate";
  if (x.includes("challenge")) return "hard";
  if (x.includes("final")) return "hard";
  return "mixed";
}

function inferMixedLevel(questionText, questionTitle, idx) {
  const probe = `${questionTitle} ${questionText}`.toLowerCase();
  if (probe.includes("(easy)") || probe.includes("🟢")) return "easy";
  if (probe.includes("(intermediate)") || probe.includes("🟡")) return "intermediate";
  if (probe.includes("(hard)") || probe.includes("🔴")) return "hard";
  const fallback = [1, 2, 3, 4, 5, 6][idx % 6];
  if (fallback <= 2) return "easy";
  if (fallback <= 4) return "intermediate";
  return "hard";
}

function difficultyFromLabel(label, bucketCounter) {
  const idx = bucketCounter[label] ?? 0;
  bucketCounter[label] = idx + 1;
  if (label === "easy") return idx % 2 === 0 ? 1 : 2;
  if (label === "intermediate") return idx % 2 === 0 ? 3 : 4;
  if (label === "hard") return idx % 2 === 0 ? 5 : 6;
  return (idx % 6) + 1;
}

function classifyFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  if (/simulation_\d+_/.test(base)) return "simulation";
  if (filePath.includes("/practice_quizzes/") || base.includes("_quiz_")) return "quiz";
  return "lesson";
}

function topicFromPath(filePath) {
  const parts = filePath.split(path.sep);
  for (const folder of TARGET_FOLDERS) {
    if (parts.includes(folder)) return TOPIC_BY_FOLDER[folder];
  }
  return null;
}

function parseSimulationSectionTopic(line) {
  const lower = stripMd(line).toLowerCase();
  if (lower.includes("sentence completion")) return "sentence_completion";
  if (lower.includes("restatement")) return "rephrasing";
  if (lower.includes("reading comprehension")) return "reading_comprehension";
  if (lower.includes("vocabulary")) return "vocabulary";
  return null;
}

function parseQuestionBlocks(markdown, fileType, fallbackTopic) {
  const lines = markdown.split("\n");
  const out = [];
  let currentTopic = fallbackTopic === "simulation" ? "sentence_completion" : fallbackTopic;
  let inAnswers = false;
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = stripMd(raw);

    if (/^##\s+Part\s+2:/i.test(line) || /^##\s+Answers/i.test(line)) {
      inAnswers = true;
    }
    if (inAnswers) break;

    if (fileType === "simulation") {
      const sectionTopic = parseSimulationSectionTopic(line);
      if (sectionTopic) currentTopic = sectionTopic;
    }

    const hQuestion = line.match(/^(?:#+\s*)?(?:✅\s*)?Question\s+(\d+)(.*)$/i);
    const qQuestion = line.match(/^(?:#+\s*)?(?:✅\s*)?Q(\d+)\.\s*(.*)$/i);
    const match = hQuestion || qQuestion;
    if (!match) {
      i += 1;
      continue;
    }

    const questionNumber = Number(match[1]);
    let questionTitle = stripMd(match[2] ?? "");
    const stemLines = [];
    const options = [];
    i += 1;

    while (i < lines.length) {
      const inner = stripMd(lines[i]);
      if (
        /^(?:#+\s*)?(?:✅\s*)?Question\s+\d+/i.test(inner) ||
        /^(?:#+\s*)?(?:✅\s*)?Q\d+\./i.test(inner) ||
        /^##\s+Part\s+2:/i.test(inner)
      ) {
        break;
      }

      if (fileType === "simulation") {
        const sectionTopic = parseSimulationSectionTopic(inner);
        if (sectionTopic && options.length === 0 && stemLines.length === 0) {
          currentTopic = sectionTopic;
          i += 1;
          continue;
        }
      }

      const original = inner.match(/^Original:\s*(.+)$/i);
      if (original) {
        stemLines.push(`Original: ${stripMd(original[1])}`);
        i += 1;
        continue;
      }

      const option = inner.match(/^\(([A-D])\)\s+(.+)$/);
      if (option) {
        options.push({ id: option[1].toLowerCase(), label: stripMd(option[2]) });
        i += 1;
        continue;
      }

      if (inner.length > 0 && !inner.startsWith("---")) {
        if (!questionTitle) questionTitle = inner;
        else stemLines.push(inner);
      }
      i += 1;
    }

    const questionText = stripMd([questionTitle, ...stemLines].filter(Boolean).join(" "));
    const topic = currentTopic;
    if (!topic || !["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"].includes(topic)) {
      continue;
    }
    if (!questionText || options.length !== 4) continue;

    out.push({
      questionNumber,
      topic,
      questionText,
      options,
    });
  }

  return out;
}

function parseAnswerEntries(markdown) {
  const lines = markdown.split("\n");
  const map = new Map();
  let current = null;
  let currentOption = null;
  let explanationLines = [];

  const flush = () => {
    if (!current || !currentOption) return;
    map.set(current, {
      correctOptionId: currentOption,
      explanation: explanationLines.join("\n").trim(),
    });
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = stripMd(raw);
    const answerHeader =
      line.match(
        /^(?:#+\s*)?(?:✅\s*)?Question\s+(\d+)\s+[-–-]\s+Answer:\s*✅?\s*\*?\*?\(([A-D])\)/i,
      ) ||
      line.match(
        /^(?:#+\s*)?(?:✅\s*)?Question\s+(\d+)\s+[-–-]\s+Correct Answer:\s*✅?\s*\*?\*?\(([A-D])\)/i,
      ) ||
      line.match(
        /^(?:#+\s*)?(?:✅\s*)?Q(\d+)\s+[-–-]\s+Correct Answer:\s*✅?\s*\*?\*?\(([A-D])\)/i,
      );
    if (answerHeader) {
      flush();
      current = Number(answerHeader[1]);
      currentOption = answerHeader[2].toLowerCase();
      explanationLines = [];
      continue;
    }
    if (!current) continue;
    const nextHeader =
      /^(?:#+\s*)?(?:✅\s*)?Question\s+\d+\s+[-–-]\s+(?:Correct )?Answer:/i.test(line) ||
      /^(?:#+\s*)?(?:✅\s*)?Q\d+\s+[-–-]\s+Correct Answer:/i.test(line) ||
      /^##\s+Part\s+3/i.test(line) ||
      /^##\s+🎯/i.test(line);
    if (nextHeader) {
      flush();
      current = null;
      currentOption = null;
      explanationLines = [];
      continue;
    }
    explanationLines.push(raw);
  }

  flush();
  return map;
}

function inferSubtopic(topic, questionText, sourceFile, guideHints) {
  const probe = normalizeText(`${questionText} ${guideHints.join(" ")}`);
  const rules = SUBTOPIC_RULES[topic] ?? [];
  for (const rule of rules) {
    if (probe.includes(rule.key)) {
      return `${topic}-${rule.slug}`;
    }
  }
  return `${topic}-${toSlug(path.basename(sourceFile, ".md"))}`;
}

function topicGuideHints(lessonFilesByTopic, topic) {
  const hints = [];
  for (const row of lessonFilesByTopic.get(topic) ?? []) {
    if (!/guide|methods|structure|trap/i.test(row.fileName)) continue;
    const firstLines = row.markdown.split("\n").slice(0, 120).join(" ");
    hints.push(stripMd(firstLines));
  }
  return hints;
}

function dedupeQuestions(questions) {
  const seen = new Set();
  const out = [];
  for (const q of questions) {
    const key = [
      q.topic,
      normalizeText(q.questionText),
      ...q.options.map((opt) => normalizeText(opt.label)),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

function validateQuestionBank(questions) {
  const errors = [];
  for (const q of questions) {
    if (!q.questionText || q.questionText.trim().length === 0) {
      errors.push(`${q.questionId}: missing questionText`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`${q.questionId}: options must be exactly 4`);
    }
    if (!q.correctOptionId) {
      errors.push(`${q.questionId}: missing correctOptionId`);
    } else if (!q.options.some((opt) => opt.id === q.correctOptionId)) {
      errors.push(`${q.questionId}: correctOptionId does not match options`);
    }
    if (!q.explanation || q.explanation.trim().length === 0) {
      errors.push(`${q.questionId}: missing explanation`);
    }
    if (!Number.isInteger(q.difficultyLevel) || q.difficultyLevel < 1 || q.difficultyLevel > 6) {
      errors.push(`${q.questionId}: invalid difficultyLevel`);
    }
    if (!q.topic) {
      errors.push(`${q.questionId}: missing topic`);
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `Question bank validation failed (${errors.length} issues):\n${errors
        .slice(0, 20)
        .join("\n")}`,
    );
  }
}

function buildLessons(allFiles) {
  const lessons = [];
  const aiRetrieval = [];
  for (const file of allFiles) {
    if (file.fileType !== "lesson") continue;
    const topic = file.topic;
    if (!topic || topic === "simulation") continue;
    const moduleSlug = MODULE_BY_TOPIC[topic];
    if (!moduleSlug) continue;
    const clean = stripMd(file.markdown);
    const paragraphs = clean
      .split(/\n\s*\n/g)
      .map((x) => stripMd(x))
      .filter(Boolean);
    if (paragraphs.length === 0) continue;
    const title = paragraphs[0].slice(0, 120);
    const lessonId = toSlug(path.basename(file.fileName, ".md"));
    const estimatedMinutes = Math.max(8, Math.min(40, Math.round(clean.split(/\s+/).length / 170)));

    const bullets = clean
      .split("\n")
      .map((row) => stripMd(row))
      .filter((row) => /^[-*]\s+/.test(row))
      .map((row) => row.replace(/^[-*]\s+/, "").trim())
      .slice(0, 6);

    lessons.push({
      moduleSlug,
      lessonId,
      lessonTitle: title || lessonId,
      lessonKind: "text",
      estimatedMinutes,
      contentBlocks: [
        { type: "intro", title: "Overview", body: paragraphs[0].slice(0, 1800) },
        {
          type: "explanation",
          title: "Core content",
          body: (paragraphs.slice(1, 5).join("\n\n") || paragraphs[0]).slice(0, 5000),
        },
        {
          type: "examples",
          title: "Examples",
          items: (bullets.length > 0 ? bullets : paragraphs.slice(1, 4)).slice(0, 6),
        },
        {
          type: "summary",
          title: "Summary",
          bullets: (bullets.length > 0 ? bullets : paragraphs.slice(-4)).slice(0, 6),
        },
      ],
      transcriptOrAudioNotes: { transcriptText: "", audioNotes: [] },
      aiRetrievalText: clean.slice(0, 12000),
    });

    aiRetrieval.push({
      docId: `doc-${lessonId}`,
      lessonId,
      moduleSlug,
      title: title || lessonId,
      body: clean.slice(0, 12000),
      tags: ["real_markdown", topic, toSlug(path.basename(file.fileName, ".md"))],
    });
  }
  return { lessons, aiRetrieval };
}

function parseSimulationSections(markdown, simulationId) {
  const lines = markdown.split("\n");
  const sections = [];
  for (const line of lines) {
    const row = line.match(
      /^\|\s*(\*?\*?\d+\*?\*?)\s*\|\s*([^|]+)\|\s*(\d+)\s*\|\s*(\d+)\s*דקות/i,
    );
    if (!row) continue;
    const sectionIndex = Number(String(row[1]).replace(/[^\d]/g, ""));
    const typeText = stripMd(row[2]).toLowerCase();
    const questionCount = Number(row[3]);
    const timeLimitSec = Number(row[4]) * 60;
    const topic = parseSimulationSectionTopic(typeText);
    if (!topic) continue;
    const scoringMode = typeText.includes("ניסיוני") || typeText.includes("experimental") ? "pilot" : "scored";
    sections.push({
      simulationId,
      sectionId: `${simulationId}-section-${sectionIndex}`,
      sectionType: topic,
      scoringMode,
      questionCount,
      timeLimitSec,
      adaptiveRules: {
        adaptiveWithinSection: false,
        adaptiveBetweenSections: true,
        enterLevelSource: "previous_section_performance",
        levelUpRule: ">=75_percent_correct_then_plus_1",
        levelDownRule: "<=25_percent_correct_then_minus_1",
        bounds: { min: 1, max: 6 },
      },
    });
  }
  return sections;
}

function extractQuizQuestions(allFiles) {
  const quizQuestions = [];
  const practiceSets = [];
  const simulationSections = [];

  const lessonByTopic = new Map();
  for (const row of allFiles) {
    if (row.fileType !== "lesson") continue;
    if (!lessonByTopic.has(row.topic)) lessonByTopic.set(row.topic, []);
    lessonByTopic.get(row.topic).push(row);
  }

  for (const file of allFiles) {
    if (file.fileType === "lesson") continue;

    if (file.fileType === "simulation") {
      const simulationId = toSlug(path.basename(file.fileName, ".md")).replace(/^simulation-/, "sim-");
      simulationSections.push(...parseSimulationSections(file.markdown, simulationId));
    }

    const fallbackTopic = file.topic === "simulation" ? "sentence_completion" : file.topic;
    const blocks = parseQuestionBlocks(file.markdown, file.fileType, fallbackTopic);
    const answers = parseAnswerEntries(file.markdown);
    const baseDifficulty = fileDifficultyLabel(file.filePath);
    const counters = { easy: 0, intermediate: 0, hard: 0, mixed: 0 };
    const guideHintsByTopic = {
      sentence_completion: topicGuideHints(lessonByTopic, "sentence_completion"),
      rephrasing: topicGuideHints(lessonByTopic, "rephrasing"),
      reading_comprehension: topicGuideHints(lessonByTopic, "reading_comprehension"),
      vocabulary: topicGuideHints(lessonByTopic, "vocabulary"),
    };

    const groupedForPractice = new Map();
    for (let idx = 0; idx < blocks.length; idx += 1) {
      const block = blocks[idx];
      const answer = answers.get(block.questionNumber);
      if (!answer?.correctOptionId || !answer.explanation.trim()) continue;
      let diffLabel = baseDifficulty;
      if (baseDifficulty === "mixed") {
        diffLabel = inferMixedLevel(block.questionText, "", idx);
      }
      const difficultyLevel = difficultyFromLabel(diffLabel, counters);
      const topic = block.topic;
      const sourceSlug = toSlug(path.basename(file.fileName, ".md"));
      const questionId = `${sourceSlug}-q${block.questionNumber}`;
      const subtopic = inferSubtopic(
        topic,
        block.questionText,
        file.fileName,
        guideHintsByTopic[topic] ?? [],
      );
      const item = {
        questionId,
        topic,
        subtopic,
        difficultyLevel,
        questionText: block.questionText,
        options: block.options,
        correctOptionId: answer.correctOptionId,
        explanation: answer.explanation.trim(),
        distractorExplanations: {},
        estimatedTimeSec: topic === "reading_comprehension" ? 90 : difficultyLevel >= 5 ? 80 : 65,
        tags: [
          "imported",
          "real_markdown",
          sourceSlug,
          file.fileType,
          `difficulty_${difficultyLevel}`,
        ],
      };
      quizQuestions.push(item);
      if (!groupedForPractice.has(topic)) groupedForPractice.set(topic, []);
      groupedForPractice.get(topic).push(item);
    }

    if (file.fileType === "quiz" && groupedForPractice.size > 0) {
      for (const [topic, rows] of groupedForPractice.entries()) {
        const moduleSlug = MODULE_BY_TOPIC[topic];
        const min = Math.min(...rows.map((x) => x.difficultyLevel));
        const max = Math.max(...rows.map((x) => x.difficultyLevel));
        practiceSets.push({
          practiceSetId: `ps-${toSlug(path.basename(file.fileName, ".md"))}-${topic}`,
          moduleSlug,
          title: `Practice ${path.basename(file.fileName, ".md")} (${topic})`,
          topic,
          subtopics: Array.from(new Set(rows.map((x) => x.subtopic))),
          difficultyRange: { min, max },
          numberOfQuestions: rows.length,
          timeLimitSec: Math.max(600, rows.length * 65),
        });
      }
    }
  }

  return {
    questions: dedupeQuestions(quizQuestions),
    practiceSets,
    simulationSections,
  };
}

function buildSyllabusMapping(lessons, practiceSets, simulationSections, aiRetrieval) {
  const topicByModule = new Map([
    ["vocabulary", "vocabulary"],
    ["sentence-completion", "sentence_completion"],
    ["sentence-rephrasing", "rephrasing"],
    ["reading-comprehension", "reading_comprehension"],
  ]);

  const items = [];
  for (const row of lessons) {
    items.push({
      syllabusBulletId: `${row.moduleSlug}-${row.lessonId}`,
      artifactType: "lesson",
      moduleSlug: row.moduleSlug,
    });
  }
  for (const row of practiceSets) {
    items.push({
      syllabusBulletId: `${row.moduleSlug}-${row.practiceSetId}`,
      artifactType: "practice_set",
      moduleSlug: row.moduleSlug,
    });
    const topic = topicByModule.get(row.moduleSlug);
    if (topic) {
      items.push({
        syllabusBulletId: `${row.moduleSlug}-${row.practiceSetId}-qb`,
        artifactType: "question_bank_batch",
        moduleSlug: row.moduleSlug,
      });
    }
  }
  for (const row of simulationSections) {
    items.push({
      syllabusBulletId: `${row.simulationId}-${row.sectionId}`,
      artifactType: "simulation_section",
      moduleSlug: "full-simulations",
    });
  }
  for (const row of aiRetrieval) {
    items.push({
      syllabusBulletId: `ai-${row.lessonId}`,
      artifactType: "ai_retrieval",
      moduleSlug: row.moduleSlug,
    });
  }
  return [
    {
      partId: "ingested-course-artifacts",
      partTitle: "Ingested Course Artifacts",
      items,
    },
  ];
}

function writeJson(fileName, data) {
  const filePath = path.join(OUTPUT_ROOT, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

/**
 * שימור שאלות שה-ingest לא מייצר: שאלות סימולציה מיובאות (tag "simulation")
 * ואוצר מילים שנוצר מרשימות המילים (tag "generated_from_course_vocab") -
 * בלי זה כל ריצת ingest הייתה מוחקת אותן. בנוסף: שיוכי passageId (קטעי
 * קריאה) מוחלים מחדש על השאלות הנבנות לפי questionId.
 */
function mergePreservedQuestions(newQuestions) {
  const outPath = path.join(OUTPUT_ROOT, "questions.json");
  if (!fs.existsSync(outPath)) return newQuestions;
  let existing;
  try {
    existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    return newQuestions;
  }
  if (!Array.isArray(existing)) return newQuestions;

  const isPreserved = (q) =>
    Array.isArray(q.tags) &&
    (q.tags.includes("simulation") || q.tags.includes("generated_from_course_vocab"));

  const passageById = new Map(
    existing.filter((q) => q.passageId).map((q) => [q.questionId, q.passageId]),
  );

  const newIds = new Set(newQuestions.map((q) => q.questionId));
  const preserved = existing.filter((q) => isPreserved(q) && !newIds.has(q.questionId));

  const withPassages = newQuestions.map((q) =>
    passageById.has(q.questionId) ? { ...q, passageId: passageById.get(q.questionId) } : q,
  );

  console.log(
    `[ingest] preserved ${preserved.length} imported/generated questions, re-applied ${[...passageById.keys()].filter((id) => newIds.has(id)).length} passage links`,
  );
  return [...withPassages, ...preserved];
}

function main() {
  const allFiles = [];
  for (const folder of TARGET_FOLDERS) {
    const folderPath = path.join(COURSE_ROOT, folder);
    if (!fs.existsSync(folderPath)) continue;
    for (const filePath of walk(folderPath)) {
      if (!filePath.toLowerCase().endsWith(".md")) continue;
      const markdown = fs.readFileSync(filePath, "utf8");
      allFiles.push({
        filePath,
        fileName: path.basename(filePath),
        topic: topicFromPath(filePath),
        fileType: classifyFile(filePath),
        markdown,
      });
    }
  }

  const { lessons, aiRetrieval } = buildLessons(allFiles);
  const { questions, practiceSets, simulationSections } = extractQuizQuestions(allFiles);
  validateQuestionBank(questions);
  const syllabusMapping = buildSyllabusMapping(
    lessons,
    practiceSets,
    simulationSections,
    aiRetrieval,
  );

  const mergedQuestions = mergePreservedQuestions(questions);
  writeJson("lessons.json", lessons);
  writeJson("questions.json", mergedQuestions);
  writeJson("practice-sets.json", practiceSets);
  writeJson("simulations.json", simulationSections);
  writeJson("ai-retrieval.json", aiRetrieval);
  writeJson("syllabus-mapping.json", syllabusMapping);

  const coverageByTopic = {};
  const coverageByDifficulty = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const q of mergedQuestions) {
    coverageByTopic[q.topic] = (coverageByTopic[q.topic] ?? 0) + 1;
    coverageByDifficulty[q.difficultyLevel] += 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    filesScanned: allFiles.length,
    fileTypeCounts: allFiles.reduce((acc, row) => {
      acc[row.fileType] = (acc[row.fileType] ?? 0) + 1;
      return acc;
    }, {}),
    lessons: lessons.length,
    aiRetrievalDocs: aiRetrieval.length,
    practiceSets: practiceSets.length,
    simulationSections: simulationSections.length,
    questionsImported: mergedQuestions.length,
    coverageByTopic,
    coverageByDifficulty,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main();
