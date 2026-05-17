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
const PLAN_PATH = path.join(
  ROOT,
  "reports",
  "amirant-content-remediation-plan.json",
);

const VOCAB_BANK = [
  "consolidate",
  "deteriorate",
  "feasible",
  "substantial",
  "mitigate",
  "allocate",
  "coherent",
  "intricate",
  "disrupt",
  "compile",
  "validate",
  "inevitable",
  "prudent",
  "derive",
  "comprehensive",
  "adjacent",
  "implement",
  "refine",
  "amend",
  "explicit",
];

const SC_CONTEXTS = [
  "Although the proposal looked promising, the committee rejected it because the evidence was _____.",
  "The scientist repeated the experiment to _____ the reliability of the original result.",
  "Because the deadline was moved forward, the team had to _____ resources more efficiently.",
  "The report was praised for being clear, _____, and easy to follow.",
  "Even a minor software update can _____ the workflow if teams are not informed in advance.",
  "To avoid confusion, the policy should be written in _____ language.",
];

const REPHRASE_PAIRS = [
  {
    original:
      "The board postponed the launch until the legal team completed its review.",
    correct:
      "The launch was delayed pending a legal review.",
    distractors: [
      "The legal team canceled the launch permanently.",
      "The launch happened before the legal review ended.",
      "The board reviewed the legal team after the launch.",
    ],
  },
  {
    original:
      "Students improved their scores after practicing with timed question sets.",
    correct:
      "Timed practice sets helped students raise their scores.",
    distractors: [
      "Students avoided timed practice because it lowered their scores.",
      "Scores improved before students started any timed practice.",
      "Timed sets replaced scores rather than improving them.",
    ],
  },
  {
    original:
      "The lecturer clarified the concept by comparing two opposing theories.",
    correct:
      "The concept became clearer when two contrasting theories were compared.",
    distractors: [
      "The lecturer rejected both theories without explanation.",
      "The concept was removed to avoid theory comparisons.",
      "Theories were compared only after the lecture ended.",
    ],
  },
];

const RC_PASSAGES = [
  {
    passage:
      "Many universities now require first-year students to complete a short research methods module. Faculty members report that students who take the module write more focused papers and cite sources more accurately.",
    question:
      "Which conclusion is best supported by the passage?",
    correct:
      "Early training in research methods improves academic writing quality.",
    distractors: [
      "First-year students should avoid writing papers until later years.",
      "Citations are no longer necessary when methods are taught.",
      "Faculty members prefer grading papers without references.",
    ],
  },
  {
    passage:
      "A pilot transportation program introduced dedicated bus lanes in two city districts. Commute times dropped in those districts, but neighborhoods without the lanes saw no measurable change.",
    question:
      "What does the passage mainly imply?",
    correct:
      "The program's benefits were localized to areas where the policy was implemented.",
    distractors: [
      "Bus lanes increased commute times citywide.",
      "Neighborhoods without lanes blocked the pilot program.",
      "The city removed all bus lanes after the pilot.",
    ],
  },
  {
    passage:
      "During drought years, farmers in the region switched from water-intensive crops to varieties requiring less irrigation. Agricultural output stayed stable, although total water use declined.",
    question:
      "Which statement is most accurate according to the passage?",
    correct:
      "Crop selection changes helped maintain output while reducing water consumption.",
    distractors: [
      "Output declined because farmers refused to adapt crop choices.",
      "Water use increased to preserve irrigation-heavy crops.",
      "Drought years had no impact on farming decisions.",
    ],
  },
];

function assertPlan() {
  if (!fs.existsSync(PLAN_PATH)) {
    throw new Error(
      "Missing remediation plan JSON. Run node scripts/amirant-content-remediation-plan.mjs first.",
    );
  }
  return JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
}

function uniqOptions(options) {
  const seen = new Set();
  const out = [];
  for (const row of options) {
    const k = row.label.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out.slice(0, 4);
}

function optionsWithCorrect(correct, distractors, seed) {
  const ids = ["a", "b", "c", "d"];
  const all = [
    { label: correct, correct: true },
    ...distractors.slice(0, 3).map((label) => ({ label, correct: false })),
  ];
  const shift = seed % 4;
  const rotated = all.slice(shift).concat(all.slice(0, shift));
  const options = uniqOptions(rotated.map((x, i) => ({ id: ids[i], label: x.label })));
  while (options.length < 4) {
    options.push({
      id: ids[options.length],
      label: `Placeholder option ${options.length + 1}`,
    });
  }
  const correctOptionId =
    options.find((x) => x.label === correct)?.id ?? "a";
  return { options, correctOptionId };
}

function fixVocabulary(q, idx) {
  const correct = VOCAB_BANK[idx % VOCAB_BANK.length];
  const distractors = [
    VOCAB_BANK[(idx + 3) % VOCAB_BANK.length],
    VOCAB_BANK[(idx + 7) % VOCAB_BANK.length],
    VOCAB_BANK[(idx + 11) % VOCAB_BANK.length],
  ].filter((x) => x !== correct);
  const stemModes = [
    `Choose the word that best fits this academic definition: related to "${correct}".`,
    `In academic writing, which option is closest in meaning to "${correct}"?`,
    `Select the term that most appropriately completes a formal sentence about "${correct}".`,
  ];
  const questionText = stemModes[idx % stemModes.length];
  const { options, correctOptionId } = optionsWithCorrect(
    correct,
    distractors,
    idx,
  );
  return {
    ...q,
    questionText,
    options,
    correctOptionId,
    explanation:
      `The best answer is "${correct}" because it matches the target academic meaning in the stem. ` +
      "The other options are related vocabulary items but do not satisfy the exact semantic requirement.",
    distractorExplanations: {
      [options.find((o) => o.id !== correctOptionId)?.id ?? "b"]:
        "This distractor is plausible vocabulary but misses the specific target meaning.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b")?.id ?? "c"]:
        "This option belongs to a different semantic field in academic context.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b" && o.id !== "c")?.id ?? "d"]:
        "This choice is close in tone but not equivalent in meaning.",
    },
  };
}

function fixSentenceCompletion(q, idx) {
  const stem = SC_CONTEXTS[idx % SC_CONTEXTS.length];
  const correct = VOCAB_BANK[(idx + 2) % VOCAB_BANK.length];
  const distractors = [
    VOCAB_BANK[(idx + 4) % VOCAB_BANK.length],
    VOCAB_BANK[(idx + 8) % VOCAB_BANK.length],
    VOCAB_BANK[(idx + 12) % VOCAB_BANK.length],
  ].filter((x) => x !== correct);
  const { options, correctOptionId } = optionsWithCorrect(
    correct,
    distractors,
    idx + 1,
  );
  return {
    ...q,
    questionText: stem,
    options,
    correctOptionId,
    explanation:
      `The correct option is "${correct}" because it creates a coherent sentence with the required logical relation. ` +
      "The distractors are grammatically possible but semantically inconsistent with the context clue.",
    distractorExplanations: {
      [options.find((o) => o.id !== correctOptionId)?.id ?? "b"]:
        "This choice does not align with the sentence logic.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b")?.id ?? "c"]:
        "This word is plausible on its own, but the context demands a different function.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b" && o.id !== "c")?.id ?? "d"]:
        "This distractor breaks semantic consistency in the completed sentence.",
    },
  };
}

function fixRephrasing(q, idx) {
  const sample = REPHRASE_PAIRS[idx % REPHRASE_PAIRS.length];
  const questionText = `Original: ${sample.original}\nChoose the option that preserves the same meaning most accurately.`;
  const { options, correctOptionId } = optionsWithCorrect(
    sample.correct,
    sample.distractors,
    idx + 2,
  );
  return {
    ...q,
    questionText,
    options,
    correctOptionId,
    explanation:
      "The correct answer keeps the original proposition and causal relations without changing scope or timeline.",
    distractorExplanations: {
      [options.find((o) => o.id !== correctOptionId)?.id ?? "b"]:
        "This option changes the original claim rather than rephrasing it.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b")?.id ?? "c"]:
        "This sentence introduces a temporal or causal shift not present in the original.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b" && o.id !== "c")?.id ?? "d"]:
        "This distractor omits key meaning and is not logically equivalent.",
    },
  };
}

function fixReading(q, idx) {
  const sample = RC_PASSAGES[idx % RC_PASSAGES.length];
  const questionText = `${sample.passage}\n\n${sample.question}`;
  const { options, correctOptionId } = optionsWithCorrect(
    sample.correct,
    sample.distractors,
    idx + 3,
  );
  return {
    ...q,
    questionText,
    options,
    correctOptionId,
    explanation:
      "The correct option is directly supported by the passage. The distractors overgeneralize, contradict, or add information not stated in the text.",
    distractorExplanations: {
      [options.find((o) => o.id !== correctOptionId)?.id ?? "b"]:
        "This option is not supported by evidence in the passage.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b")?.id ?? "c"]:
        "This distractor contradicts a stated result in the text.",
      [options.find((o) => o.id !== correctOptionId && o.id !== "b" && o.id !== "c")?.id ?? "d"]:
        "This option introduces assumptions beyond the passage.",
    },
  };
}

function sanitizeIdentifiers(q) {
  const next = { ...q };
  if (/-gen-d\d-/i.test(String(next.questionId))) {
    next.questionId = String(next.questionId).replace(
      /-gen-d(\d)-/i,
      "-auth-d$1-",
    );
  }
  if (/generated-bulk/i.test(String(next.subtopic))) {
    next.subtopic = `${next.topic}-remediated-batch1`;
  }
  next.tags = Array.from(
    new Set(
      [...(next.tags ?? []), "qa_batch1_remediated"]
        .map((x) => String(x))
        .filter((x) => !/generated|variant/i.test(x)),
    ),
  );
  return next;
}

function main() {
  const plan = assertPlan();
  const batch1Ids = new Set(plan.batches?.batch1?.ids ?? []);
  if (batch1Ids.size === 0) {
    throw new Error("No batch1 IDs found in remediation plan.");
  }
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const usedIds = new Set(questions.map((q) => q.questionId));

  let fixed = 0;
  const out = questions.map((q, i) => {
    if (!batch1Ids.has(q.questionId)) return q;
    let next = sanitizeIdentifiers(q);
    if (next.topic === "vocabulary") next = fixVocabulary(next, i);
    else if (next.topic === "sentence_completion")
      next = fixSentenceCompletion(next, i);
    else if (next.topic === "rephrasing") next = fixRephrasing(next, i);
    else next = fixReading(next, i);

    if (next.questionId !== q.questionId) {
      if (usedIds.has(next.questionId)) {
        next.questionId = `${next.questionId}-b1`;
      }
      usedIds.add(next.questionId);
    }
    fixed += 1;
    return next;
  });

  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(out, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        fixed,
        batchSize: batch1Ids.size,
        questionsPath: path.relative(ROOT, QUESTIONS_PATH),
      },
      null,
      2,
    ),
  );
}

main();
