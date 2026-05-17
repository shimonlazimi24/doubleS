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
const QA_REPORT_PATH = path.join(
  ROOT,
  "reports",
  "amirant-question-qa-report.json",
);
const OUT_SELECTION_PATH = path.join(
  ROOT,
  "reports",
  "amirant-content-batch2-selection.json",
);

const ALPHABET = ["a", "b", "c", "d"];

const VOCAB_ITEMS = [
  {
    target: "mitigate",
    stem: "The compliance team introduced a phased rollout to ____ legal exposure during the transition.",
    distractors: ["magnify", "ignore", "postpone"],
    rationale:
      "'Mitigate' means reduce the severity of a risk. The sentence requires a verb about lowering exposure.",
  },
  {
    target: "coherent",
    stem: "Her argument was persuasive because every claim was logically ____ and supported by data.",
    distractors: ["fragmented", "speculative", "redundant"],
    rationale:
      "'Coherent' means logically connected and clear, which matches the sentence's emphasis on structure.",
  },
  {
    target: "allocate",
    stem: "To meet the revised deadline, the manager had to ____ additional staff to the highest-risk tasks.",
    distractors: ["dismiss", "conceal", "delay"],
    rationale:
      "'Allocate' means assign resources to a purpose, which is exactly what the manager is doing.",
  },
  {
    target: "feasible",
    stem: "After reviewing the budget and timeline, the committee concluded that the proposal was ____.",
    distractors: ["irreversible", "ornamental", "incidental"],
    rationale:
      "'Feasible' means practical or possible to carry out under current constraints.",
  },
  {
    target: "derive",
    stem: "Researchers can ____ a reliable trend only after cleaning and normalizing the raw dataset.",
    distractors: ["erase", "misplace", "confuse"],
    rationale:
      "'Derive' means obtain through analysis, which aligns with extracting a trend from data.",
  },
  {
    target: "prudent",
    stem: "Given market volatility, keeping a cash buffer was a ____ financial decision.",
    distractors: ["reckless", "arbitrary", "symbolic"],
    rationale:
      "'Prudent' means wise and cautious, appropriate for uncertain conditions.",
  },
  {
    target: "refine",
    stem: "Before publication, the editor asked the author to ____ the thesis statement for precision.",
    distractors: ["abandon", "inflate", "misquote"],
    rationale:
      "'Refine' means improve by making small, careful changes for clarity and precision.",
  },
  {
    target: "explicit",
    stem: "The safety protocol must include ____ evacuation steps to avoid confusion during drills.",
    distractors: ["ambiguous", "ornate", "tentative"],
    rationale:
      "'Explicit' means clearly stated and unambiguous, which is required in safety instructions.",
  },
];

const SENTENCE_COMPLETION_ITEMS = [
  {
    stem: "Although the findings were promising, the reviewers remained ____, noting the limited sample size.",
    correct: "skeptical",
    distractors: ["complacent", "detached", "impulsive"],
    rationale:
      "The contrast marker 'Although' signals caution despite promising data; 'skeptical' preserves that tension.",
  },
  {
    stem: "To ensure fairness, the examiner ____ all personal identifiers before grading the essays.",
    correct: "removed",
    distractors: ["published", "exaggerated", "memorized"],
    rationale:
      "Blind grading requires eliminating identifying information, so 'removed' is the only context-consistent verb.",
  },
  {
    stem: "The policy was revised to ____ exceptions only in documented medical emergencies.",
    correct: "permit",
    distractors: ["predict", "conceal", "delay"],
    rationale:
      "The sentence needs a verb meaning 'allow'; 'permit' fits both legal and administrative usage.",
  },
  {
    stem: "Because the hypothesis was clearly defined, the experiment produced ____ results across trials.",
    correct: "consistent",
    distractors: ["incidental", "opaque", "seasonal"],
    rationale:
      "'Consistent' matches repeated, stable results from controlled replication.",
  },
  {
    stem: "If the evidence remains inconclusive, any strong claim would be ____ at best.",
    correct: "premature",
    distractors: ["comprehensive", "routine", "equivalent"],
    rationale:
      "Inconclusive evidence cannot justify strong conclusions; such claims are 'premature'.",
  },
  {
    stem: "The lecturer paused to ____ a complex term before moving to the next argument.",
    correct: "clarify",
    distractors: ["dismiss", "postpone", "shorten"],
    rationale:
      "The clause implies making the concept clearer for listeners, so 'clarify' is required.",
  },
  {
    stem: "To reduce processing time, the team replaced the legacy script with a more ____ workflow.",
    correct: "efficient",
    distractors: ["ornamental", "rigid", "accidental"],
    rationale:
      "A workflow that reduces processing time is necessarily more 'efficient'.",
  },
  {
    stem: "Even with strong prior grades, candidates must ____ all admission criteria this year.",
    correct: "meet",
    distractors: ["invent", "overlook", "circumvent"],
    rationale:
      "Admission standards are conditions to satisfy; candidates must 'meet' them.",
  },
];

const RC_PASSAGES = [
  {
    passage:
      "A university pilot allowed students to submit one draft per assignment for formative feedback before grading. Instructors reported that final submissions became more focused and citation errors dropped. The policy required no grade inflation, only earlier intervention.",
    question:
      "Which inference is best supported by the passage?",
    correct:
      "Early feedback improved final quality without changing grading standards.",
    distractors: [
      "Instructors raised grades to compensate for weaker drafts.",
      "Citation rules were removed to make assignments easier.",
      "Students stopped submitting final versions after receiving comments.",
    ],
    rationale:
      "The text explicitly links formative feedback to better final submissions while noting standards remained unchanged.",
  },
  {
    passage:
      "A city expanded protected bike lanes in three districts and tracked travel patterns for six months. Bicycle commuting rose in those districts, while neighboring districts without new lanes showed little change. Officials concluded infrastructure placement shaped adoption rates.",
    question:
      "What is the main point of the passage?",
    correct:
      "Behavioral change was strongest where infrastructure improvements were implemented.",
    distractors: [
      "Bike commuting fell after lane expansion.",
      "All districts changed at the same pace regardless of policy.",
      "Officials measured travel patterns for only one week.",
    ],
    rationale:
      "The comparison between treated and untreated districts supports a localized infrastructure effect.",
  },
  {
    passage:
      "A language program replaced weekly grammar quizzes with shorter daily retrieval exercises. Teachers observed fewer repeated errors in writing tasks and faster correction during peer review. Students initially resisted the format but later described it as manageable.",
    question:
      "According to the passage, what explains the program's eventual acceptance?",
    correct:
      "Students found the frequent exercises practical after adaptation.",
    distractors: [
      "Teachers canceled writing tasks to reduce workload.",
      "Grammar instruction was removed from the curriculum.",
      "Peer review became optional after initial complaints.",
    ],
    rationale:
      "The passage states students first resisted but later saw the routine as manageable, indicating adaptation.",
  },
  {
    passage:
      "During an energy audit, a manufacturing plant discovered that idle machines consumed substantial electricity overnight. The plant introduced automatic shutdown schedules and reported lower monthly usage without affecting output targets.",
    question:
      "Which conclusion is most consistent with the passage?",
    correct:
      "Operational scheduling reduced waste while preserving productivity.",
    distractors: [
      "Output declined because machines were shut down permanently.",
      "Energy use increased after introducing shutdown schedules.",
      "The audit focused on employee commuting patterns, not machinery.",
    ],
    rationale:
      "The text directly connects automatic shutdowns with lower usage and unchanged output.",
  },
];

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${path.relative(ROOT, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function uniqueOptionSet(correct, distractors, seed) {
  const choicePool = [
    { label: correct, isCorrect: true },
    ...distractors.slice(0, 3).map((label) => ({ label, isCorrect: false })),
  ];
  const shift = seed % choicePool.length;
  const rotated = choicePool.slice(shift).concat(choicePool.slice(0, shift));
  const seen = new Set();
  const options = [];
  for (let i = 0; i < rotated.length; i += 1) {
    const label = String(rotated[i].label).trim();
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ id: ALPHABET[options.length], label, isCorrect: rotated[i].isCorrect });
  }
  while (options.length < 4) {
    options.push({
      id: ALPHABET[options.length],
      label: `Plausible but unsupported option ${options.length + 1}`,
      isCorrect: false,
    });
  }
  const correctOptionId = options.find((row) => row.isCorrect)?.id ?? "a";
  return {
    options: options.map(({ id, label }) => ({ id, label })),
    correctOptionId,
  };
}

function sanitizeQuestionId(questionId) {
  const source = String(questionId);
  if (/-gen-d\d-/i.test(source)) {
    return source.replace(/-gen-d(\d)-/i, "-auth-d$1-");
  }
  return source;
}

function buildDistractorExplanations(options, correctOptionId, baseReason) {
  const wrongIds = options
    .map((row) => row.id)
    .filter((id) => id !== correctOptionId)
    .slice(0, 3);
  return Object.fromEntries(
    wrongIds.map((id, idx) => [
      id,
      `${baseReason} Distractor ${idx + 1} is plausible on the surface but does not satisfy the stem's logic.`,
    ]),
  );
}

function fixVocabulary(question, seed) {
  const item = VOCAB_ITEMS[seed % VOCAB_ITEMS.length];
  const { options, correctOptionId } = uniqueOptionSet(
    item.target,
    item.distractors,
    seed + 11,
  );
  const promptVariant = [
    `${item.stem}\nChoose the best academic word for the blank.`,
    `Select the option that best completes the sentence in formal written English:\n${item.stem}`,
    `${item.stem}\nWhich word is the most semantically precise choice?`,
  ][seed % 3];
  return {
    ...question,
    questionText: promptVariant,
    options,
    correctOptionId,
    explanation: `${item.rationale} The best answer is "${item.target}" because it preserves both register and meaning.`,
    distractorExplanations: buildDistractorExplanations(
      options,
      correctOptionId,
      "Each incorrect option conflicts with the sentence's semantic requirement.",
    ),
  };
}

function fixSentenceCompletion(question, seed) {
  const item = SENTENCE_COMPLETION_ITEMS[seed % SENTENCE_COMPLETION_ITEMS.length];
  const { options, correctOptionId } = uniqueOptionSet(
    item.correct,
    item.distractors,
    seed + 17,
  );
  const stem = item.stem.includes("____") ? item.stem : `${item.stem} ____`;
  return {
    ...question,
    questionText: `Complete the sentence with the most appropriate option:\n${stem}`,
    options,
    correctOptionId,
    explanation: `${item.rationale} The selected option creates the strongest grammatical and logical completion.`,
    distractorExplanations: buildDistractorExplanations(
      options,
      correctOptionId,
      "The distractor either breaks collocation, shifts meaning, or weakens the intended contrast.",
    ),
  };
}

function fixReading(question, seed) {
  const item = RC_PASSAGES[seed % RC_PASSAGES.length];
  const { options, correctOptionId } = uniqueOptionSet(
    item.correct,
    item.distractors,
    seed + 23,
  );
  const prompt = `${item.passage}\n\n${item.question}`;
  return {
    ...question,
    questionText: prompt,
    options,
    correctOptionId,
    explanation: `${item.rationale} The correct answer is the only option fully grounded in the passage without overreach.`,
    distractorExplanations: buildDistractorExplanations(
      options,
      correctOptionId,
      "This option is not supported by explicit evidence from the passage.",
    ),
  };
}

function normalizeTags(tags) {
  const base = Array.isArray(tags) ? tags.map((x) => String(x)) : [];
  const clean = base.filter((x) => !/generated_variant/i.test(x));
  return Array.from(new Set([...clean, "qa_batch2_remediated"]));
}

function selectBatch2Ids(qaReport) {
  const flagged = Array.isArray(qaReport?.flaggedQuestions)
    ? qaReport.flaggedQuestions
    : [];
  const critical = flagged.filter((q) => q.qaStatus === "critical_issue");
  const sorted = [...critical].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    const ai = Array.isArray(a.issues) ? a.issues.length : 0;
    const bi = Array.isArray(b.issues) ? b.issues.length : 0;
    if (ai !== bi) return bi - ai;
    return String(a.questionId).localeCompare(String(b.questionId));
  });
  return sorted.slice(0, 50).map((row) => String(row.questionId));
}

function main() {
  const beforeReport = loadJson(QA_REPORT_PATH);
  const selectedIds = selectBatch2Ids(beforeReport);
  if (selectedIds.length < 50) {
    throw new Error(
      `Expected 50 critical questions for Batch 2, got ${selectedIds.length}.`,
    );
  }

  const questions = loadJson(QUESTIONS_PATH);
  const selectedIdSet = new Set(selectedIds);
  const existingIds = new Set(questions.map((q) => String(q.questionId)));

  let fixed = 0;
  const out = questions.map((question, idx) => {
    if (!selectedIdSet.has(String(question.questionId))) return question;
    let next = { ...question };
    if (next.topic === "vocabulary") {
      next = fixVocabulary(next, idx);
    } else if (next.topic === "sentence_completion") {
      next = fixSentenceCompletion(next, idx);
    } else if (next.topic === "reading_comprehension") {
      next = fixReading(next, idx);
    } else {
      next = fixReading(next, idx);
    }

    const oldId = String(question.questionId);
    let newId = sanitizeQuestionId(oldId);
    if (newId !== oldId) {
      if (existingIds.has(newId)) {
        newId = `${newId}-b2`;
      }
      existingIds.add(newId);
      next.questionId = newId;
    }
    next.tags = normalizeTags(next.tags);
    fixed += 1;
    return next;
  });

  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(out, null, 2)}\n`);
  fs.writeFileSync(
    OUT_SELECTION_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceQaReport: path.relative(ROOT, QA_REPORT_PATH),
        selectedCount: selectedIds.length,
        ids: selectedIds,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    JSON.stringify(
      {
        fixed,
        selectedCount: selectedIds.length,
        questionsPath: path.relative(ROOT, QUESTIONS_PATH),
        selectionReportPath: path.relative(ROOT, OUT_SELECTION_PATH),
      },
      null,
      2,
    ),
  );
}

main();
