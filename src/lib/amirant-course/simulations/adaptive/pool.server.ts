/**
 * The owner's simulation pool, every wave, with the answer keys.
 *
 * Server only: the adaptive route reads items, keys and rules from here and
 * sends the browser the public shapes in `types.ts`. Adding a wave is one
 * ingest run (scripts/simulation-pool/ingest-pool.mjs); this module reads
 * whatever index.json lists.
 */
import fs from "node:fs";
import path from "node:path";
import type { BandFeedback, ClientPassage, ClientQuestion, ClientWordFormation, ClientWritingTask, Level, PoolItemType } from "./types";
import type { PoolIndexItem, PoolRules } from "./engine";

type Explanation = { he: string; en: string };

type McQuestion = { qid?: string; questionId: string; stem: string; options: string[]; correct: number; b?: number; explanation: Explanation };

type PoolItem = {
  id: string;
  type: PoolItemType;
  level: Level;
  b: number;
  topic: string | null;
  method: string | null;
  group: string | null;
  related: string | null;
  // sentence_completion / restatement
  questionId?: string;
  stem?: string;
  options?: string[];
  correct?: number;
  explanation?: Explanation;
  // reading_set
  passageId?: string;
  title?: string;
  paragraphs?: string[];
  glossary?: { word: string; he: string; en: string; pronunciation: string }[];
  questions?: McQuestion[];
  // listening_lecture
  clipId?: string;
  clipSeconds?: number;
  context?: string;
  speakers?: string[];
  voiceDirection?: string;
  script?: string[];
  // word_formation
  sentence?: string;
  baseWord?: string;
  accepted?: string[];
  answer?: string;
  // writing_task
  taskId?: string;
  prompt?: string;
  wordRange?: [number, number];
  highModel?: string;
  rubricHigh?: { content: string; language: string };
};

type Wave = {
  simId: string;
  titleHe: string;
  sectionTimes: PoolRules["sectionTimes"];
  startLevel: number;
  scoreAnchors: [number, number][];
  bands: [number, number, string][];
  experimentalBonus: [number, number][];
  items: PoolItem[];
};

const POOL_DIR = path.join(process.cwd(), "content/amirant-import/owner/simulation-pool");
const OPTION_IDS = ["a", "b", "c", "d"];

let loaded: { waves: Wave[]; items: Map<string, PoolItem>; index: PoolIndexItem[]; byQuestion: Map<string, { item: PoolItem; q: McQuestion }> } | null = null;

function load() {
  if (loaded) return loaded;
  const indexPath = path.join(POOL_DIR, "index.json");
  const waves: Wave[] = [];
  if (fs.existsSync(indexPath)) {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf8")) as { waves: { file: string }[] };
    for (const w of idx.waves) waves.push(JSON.parse(fs.readFileSync(path.join(POOL_DIR, w.file), "utf8")) as Wave);
  }
  const items = new Map<string, PoolItem>();
  const index: PoolIndexItem[] = [];
  const byQuestion = new Map<string, { item: PoolItem; q: McQuestion }>();
  for (const w of waves) {
    for (const it of w.items) {
      items.set(it.id, it);
      index.push({ id: it.id, type: it.type, level: it.level, b: it.b, passageId: it.passageId, clipSeconds: it.clipSeconds, related: it.related });
      if (it.questions) for (const q of it.questions) byQuestion.set(q.questionId, { item: it, q });
      else if (it.questionId && it.options) {
        byQuestion.set(it.questionId, {
          item: it,
          q: { questionId: it.questionId, stem: it.stem!, options: it.options, correct: it.correct!, explanation: it.explanation! },
        });
      }
    }
  }
  loaded = { waves, items, index, byQuestion };
  return loaded;
}

export function poolIsAvailable(): boolean {
  return load().waves.length > 0;
}

export function poolWaveIds(): string[] {
  return load().waves.map((w) => w.simId);
}

/** The rules come from the first wave; later waves only add items. */
export function poolRules(): PoolRules {
  const w = load().waves[0];
  if (!w) throw new Error("simulation pool is empty");
  return {
    startLevel: w.startLevel,
    sectionTimes: w.sectionTimes,
    scoreAnchors: w.scoreAnchors,
    bands: w.bands,
    experimentalBonus: w.experimentalBonus,
  };
}

export function poolIndex(): PoolIndexItem[] {
  return load().index;
}

export function poolTypesAvailable(): Set<PoolItemType> {
  return new Set(load().index.map((it) => it.type));
}

export function getPoolItem(id: string): PoolItem | undefined {
  return load().items.get(id);
}

/** The id the engine should mark used for an item (passage/clip id for sets, so the whole set is spent). */
export function usedIdFor(item: PoolItem): string {
  return item.id;
}

export function clientQuestionsFor(item: PoolItem): ClientQuestion[] {
  if (item.questions) {
    return item.questions.map((q) => ({
      questionId: q.questionId,
      stem: q.stem,
      options: q.options.map((label, i) => ({ id: OPTION_IDS[i]!, label })),
      passageId: item.passageId,
    }));
  }
  return [
    {
      questionId: item.questionId!,
      stem: item.stem!,
      options: item.options!.map((label, i) => ({ id: OPTION_IDS[i]!, label })),
    },
  ];
}

export function clientPassageFor(item: PoolItem): ClientPassage | null {
  if (item.type === "reading_set") {
    const glossary = (item.glossary ?? []).length
      ? `\n\n**Glossary**\n\n${item.glossary!.map((g) => `${g.word} [${g.pronunciation}] — ${g.he}. _${g.en}_`).join("\n\n")}`
      : "";
    return { id: item.passageId!, title: item.title ?? "", bodyMarkdown: `${item.paragraphs!.join("\n\n")}${glossary}` };
  }
  if (item.type === "listening_lecture") {
    return {
      id: item.passageId!,
      title: `קטע שמע · כ-${item.clipSeconds} שניות`,
      bodyMarkdown: `{{audio:ls-${item.clipId}|קטע שמע}}\n\n${item.context ?? ""}`,
    };
  }
  return null;
}

export function clientWordFormationFor(item: PoolItem): ClientWordFormation {
  return { questionId: item.questionId!, sentence: item.sentence!, baseWord: item.baseWord! };
}

export function clientWritingFor(item: PoolItem): ClientWritingTask {
  return { taskId: item.taskId!, prompt: item.prompt!, wordRange: item.wordRange ?? [90, 120] };
}

/** Multiple-choice key by question id (sentence completion, restatement, reading, listening). */
export function poolMcKey(questionId: string): { correctOptionId: string; explanation: Explanation; itemId: string } | undefined {
  const hit = load().byQuestion.get(questionId);
  if (!hit) return undefined;
  return { correctOptionId: OPTION_IDS[hit.q.correct]!, explanation: hit.q.explanation, itemId: hit.item.id };
}

/** Word-formation key in the shape grade-word.ts grades. */
export function poolWordFormationKey(questionId: string): { baseWord: string; accepted: string[]; mistakes: Record<string, string>; explanation: string; itemId: string } | undefined {
  for (const it of Array.from(load().items.values())) {
    if (it.type === "word_formation" && it.questionId === questionId) {
      return {
        baseWord: it.baseWord!,
        accepted: it.accepted!,
        mistakes: {},
        explanation: `**הסבר קצר:** ${it.explanation?.he ?? ""}\n\n_${it.explanation?.en ?? ""}_`,
        itemId: it.id,
      };
    }
  }
  return undefined;
}

export type ReportCopy = {
  disclaimersHe: string[];
  bands: BandFeedback[];
  sectionNotes: { type: PoolItemType; labelHe: string; strongHe: string; midHe: string; weakHe: string; methodHe: string }[];
  sectionThresholds: { strong: number; mid: number };
};

let reportCopy: ReportCopy | null | undefined;

/** The final-report copy from the pool document (scripts/simulation-pool/parse-report-doc.mjs); null when not ingested. */
export function poolReportCopy(): ReportCopy | null {
  if (reportCopy !== undefined) return reportCopy;
  const file = path.join(POOL_DIR, "report.json");
  reportCopy = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as ReportCopy) : null;
  return reportCopy;
}

export function poolWritingItem(taskId: string): PoolItem | undefined {
  for (const it of Array.from(load().items.values())) if (it.type === "writing_task" && it.taskId === taskId) return it;
  return undefined;
}
