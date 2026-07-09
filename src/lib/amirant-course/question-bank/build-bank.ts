import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import type { AmirantBankTopicSlug, BankQuestion } from "../types/bank-question";

function opt(id: string, label: string): { id: string; label: string } {
  return { id, label };
}

function makeId(n: number): string {
  return `arq-${String(n).padStart(5, "0")}`;
}

function buildForTopic(topic: AmirantBankTopicSlug, difficulty: DifficultyLevel, slot: number, seq: number): BankQuestion {
  const id = makeId(seq);
  const correctId = `${id}-a`;
  const w = (suffix: string, label: string) => opt(`${id}-w${suffix}`, label);

  if (topic === "vocabulary") {
    const tier = ["basic", "clear", "precise", "nuanced", "formal", "rare"][difficulty - 1];
    const kinds = ["verbs", "nouns", "adjectives", "adverbs", "phrasal"] as const;
    const kind = kinds[slot % kinds.length];
    const kindEn =
      kind === "verbs"
        ? "verb"
        : kind === "nouns"
          ? "noun"
          : kind === "adjectives"
            ? "adjective"
            : kind === "adverbs"
              ? "adverb / connective"
              : "phrasal choice";
    const stem = `Choose the best ${tier}-register ${kindEn} for academic writing (set ${slot + 1}).`;
    return {
      id,
      prompt: stem,
      options: [
        opt(correctId, difficulty >= 4 ? "substantiate" : "show"),
        w("1", "decorate"),
        w("2", "ignore"),
        w("3", "borrow"),
      ],
      correctOptionId: correctId,
      explanation: "Academic tone prefers neutral, precise word choice over informal or vague options.",
      topicSlug: topic,
      subtopicSlug: `vocab-${kind}-${difficulty}`,
      difficulty,
    };
  }

  if (topic === "sentence_completion") {
    return {
      id,
      prompt: `Complete: "Although the sample was small, the findings _____ previous assumptions." (${String.fromCharCode(65 + slot)})`,
      options: [
        w("1", "denies"),
        opt(correctId, "challenge"),
        w("2", "copies"),
        w("3", "ignores"),
      ],
      correctOptionId: correctId,
      explanation: '"Challenge" fits academic reporting; check tense and collocation.',
      topicSlug: topic,
      subtopicSlug: `sc-collocation-${difficulty}`,
      difficulty,
    };
  }

  if (topic === "rephrasing") {
    return {
      id,
      prompt: `Original: "Diabetes contributes to many deaths from cardiovascular disease." Which paraphrase preserves meaning? (${slot + 1})`,
      options: [
        w("1", "Diabetes prevents most cardiovascular deaths"),
        opt(correctId, "Diabetes is linked to numerous cardiovascular fatalities"),
        w("2", "Diabetes only affects young people"),
        w("3", "Cardiovascular disease has no relation to diabetes"),
      ],
      correctOptionId: correctId,
      explanation: "Avoid subtle meaning shifts (many vs most, causes vs prevents).",
      topicSlug: topic,
      subtopicSlug: `restate-trap-${difficulty}`,
      difficulty,
    };
  }

  return {
    id,
    prompt:
      "Which claim is most supported by a typical academic passage about replication?",
    options: [
      w("1", "Replication is unnecessary"),
      w("2", "One study is always definitive"),
      opt(correctId, "Replication reduces the risk of false positives"),
      w("3", "Peer review guarantees truth"),
    ],
    correctOptionId: correctId,
    explanation: "Careful reading distinguishes warranted conclusions from overstated claims.",
    topicSlug: "reading_comprehension",
    subtopicSlug: `rc-inference-${difficulty}`,
    difficulty,
  };
}

/** 4 topics × 6 levels × 5 variants = 120 questions - enough for adaptive + simulations. */
export function buildAmirantQuestionBank(): BankQuestion[] {
  const topics: AmirantBankTopicSlug[] = [
    "vocabulary",
    "sentence_completion",
    "rephrasing",
    "reading_comprehension",
  ];
  const out: BankQuestion[] = [];
  let seq = 1;
  for (const topic of topics) {
    for (let d = 1; d <= 6; d++) {
      const difficulty = d as DifficultyLevel;
      for (let slot = 0; slot < 5; slot++) {
        out.push(buildForTopic(topic, difficulty, slot, seq));
        seq += 1;
      }
    }
  }
  return out;
}
