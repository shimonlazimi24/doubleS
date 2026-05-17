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

function updateOptionLabel(question, optionId, nextLabel) {
  question.options = question.options.map((opt) =>
    opt.id === optionId ? { ...opt, label: nextLabel } : opt,
  );
}

function ensureQuestionText(question, text) {
  question.questionText = text;
}

function setTopicAndSubtopic(question, topic, subtopic) {
  question.topic = topic;
  question.subtopic = subtopic;
}

function main() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8"));
  const byId = new Map(questions.map((q) => [q.questionId, q]));
  const touched = [];

  const touch = (id, fn) => {
    const q = byId.get(id);
    if (!q) throw new Error(`Missing question: ${id}`);
    fn(q);
    touched.push(id);
  };

  // too_easy_to_eliminate
  touch("sc-quiz-4-intermediate-q6", (q) => {
    updateOptionLabel(q, "c", "In spite of");
  });
  touch("reading-comp-quiz-7-mixed-q1", (q) => {
    updateOptionLabel(
      q,
      "b",
      "Stress can improve memory at moderate levels, but prolonged stress damages recall.",
    );
  });

  // duplicate_or_similar_options
  touch("restatement-quiz-2-easy-q6", (q) => {
    updateOptionLabel(q, "a", "She is the older sibling in her family.");
  });
  touch("restatement-quiz-2-easy-q10", (q) => {
    updateOptionLabel(q, "c", "This book is less expensive than that one.");
  });
  touch("restatement-quiz-4-intermediate-q7", (q) => {
    updateOptionLabel(q, "d", "She lacks a valid passport for international travel.");
  });
  touch("restatement-quiz-8-mixed-q4", (q) => {
    updateOptionLabel(q, "a", "Coffee is her preferred drink over tea.");
  });

  // difficulty_mismatch (stem was polluted by passage text)
  touch("reading-comp-quiz-1-easy-q3", (q) => {
    ensureQuestionText(
      q,
      'In the passage, the phrase "no specific skills" suggests that walking:',
    );
  });

  // simulation language_quality fixes (remove Hebrew spillover from stem)
  touch("simulation-1-baseline-q4", (q) => {
    ensureQuestionText(q, "Despite the cold weather, the children ______ to play outside.");
  });
  touch("simulation-1-baseline-q8", (q) => {
    ensureQuestionText(
      q,
      "The company's profits have increased ______ over the past five years.",
    );
  });
  touch("simulation-1-baseline-q13", (q) => {
    ensureQuestionText(
      q,
      "What can be inferred about the author's attitude toward fast fashion?",
    );
  });
  touch("simulation-1-baseline-q16", (q) => {
    ensureQuestionText(
      q,
      "Original: She would have attended the wedding had she not been sick.",
    );
  });
  touch("simulation-1-baseline-q19", (q) => {
    ensureQuestionText(
      q,
      "Original: The new software allows users to complete tasks more efficiently.",
    );
  });
  touch("simulation-1-baseline-q23", (q) => {
    ensureQuestionText(
      q,
      "The findings of the study were ______ with those of previous research on the topic.",
    );
  });
  touch("simulation-1-baseline-q27", (q) => {
    ensureQuestionText(
      q,
      "The report highlights the ______ of early intervention in education. (IMPORTANT)",
    );
  });
  touch("simulation-1-baseline-q31", (q) => {
    ensureQuestionText(
      q,
      "She is one of the most talented musicians ______ I have ever heard.",
    );
  });

  // topic_subtopic_mismatch fixes in simulation section (reclassify by actual item type)
  touch("simulation-1-baseline-q9", (q) => {
    setTopicAndSubtopic(q, "reading_comprehension", "reading_comprehension-simulation-main-idea");
  });
  touch("simulation-1-baseline-q10", (q) => {
    setTopicAndSubtopic(q, "reading_comprehension", "reading_comprehension-simulation-detail");
  });
  touch("simulation-1-baseline-q11", (q) => {
    setTopicAndSubtopic(q, "reading_comprehension", "reading_comprehension-simulation-detail");
  });
  touch("simulation-1-baseline-q12", (q) => {
    setTopicAndSubtopic(q, "reading_comprehension", "reading_comprehension-simulation-vocab-context");
  });
  touch("simulation-1-baseline-q13", (q) => {
    setTopicAndSubtopic(q, "reading_comprehension", "reading_comprehension-simulation-inference");
  });

  touch("simulation-1-baseline-q14", (q) => {
    setTopicAndSubtopic(q, "rephrasing", "rephrasing-simulation-restatement");
  });
  touch("simulation-1-baseline-q15", (q) => {
    setTopicAndSubtopic(q, "rephrasing", "rephrasing-simulation-restatement");
  });
  touch("simulation-1-baseline-q16", (q) => {
    setTopicAndSubtopic(q, "rephrasing", "rephrasing-simulation-restatement");
  });
  touch("simulation-1-baseline-q17", (q) => {
    setTopicAndSubtopic(q, "rephrasing", "rephrasing-simulation-restatement");
  });
  touch("simulation-1-baseline-q18", (q) => {
    setTopicAndSubtopic(q, "rephrasing", "rephrasing-simulation-restatement");
  });
  touch("simulation-1-baseline-q19", (q) => {
    setTopicAndSubtopic(q, "rephrasing", "rephrasing-simulation-restatement");
  });

  fs.writeFileSync(QUESTIONS_PATH, `${JSON.stringify(questions, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        touchedCount: new Set(touched).size,
        touchedIds: Array.from(new Set(touched)),
      },
      null,
      2,
    ),
  );
}

main();
