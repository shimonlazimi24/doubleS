/**
 * Grades one practice essay the way the exam's automatic scorer does: two
 * dimensions, three levels each, against the task's own rubric, with the
 * task's three reference essays as calibration.
 *
 * The model (gpt-4.1 unless OPENAI_WRITING_MODEL says otherwise) returns a
 * structured verdict; the hard rules of the info sheet are applied here in
 * code afterwards, so a generous model cannot pass a short or off-topic
 * answer: under 90 words or off topic caps content at "low".
 *
 * Measured on the owner's mid-level sample: about five seconds, roughly
 * 2,200 tokens, around two agorot per essay.
 */
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAiApiKey } from "../ai/ai-config";
import { logAiError, logAiRequest, logAiResponse } from "../ai/ai-logger";
import { redactPersonalData } from "../ai/safety";
import { getWritingGuide } from "./writing-tasks.server";
import { countWords, type WritingGradeResult, type WritingLevel, type WritingTaskPublic } from "./types";

export const DEFAULT_WRITING_MODEL = "gpt-4.1";
export const WRITING_MODEL = process.env.OPENAI_WRITING_MODEL?.trim() || DEFAULT_WRITING_MODEL;
const TIMEOUT_MS = 45_000;

const Level = z.enum(["low", "mid", "high"]);

const GradeSchema = z.object({
  onTopic: z.boolean(),
  content: z.object({ level: Level, whyHe: z.string() }),
  language: z.object({ level: Level, whyHe: z.string() }),
  workedHe: z.array(z.string()),
  fixHe: z.array(z.string()),
  upgradedSentence: z.object({ original: z.string(), better: z.string(), whyHe: z.string() }),
  flaggedErrors: z.array(z.object({ found: z.string(), write: z.string(), noteHe: z.string() })),
});

const LEVEL_HE: Record<WritingLevel, string> = { low: "נמוכה", mid: "בינונית", high: "גבוהה" };

function systemPrompt(): string {
  return [
    "You grade practice responses for the AMIRNET (Israeli university English placement exam) writing task.",
    "The task: one opinion or choice question, 90–120 words, 12 minutes, typed. The exam scores two dimensions, each on three levels (low / mid / high):",
    "1. content and organization: answers exactly the question asked, a clear position in the first sentence, at least two reasons each developed with an explanation or example, logical order with linking words, a closing sentence that restates the position.",
    "2. language range and accuracy: varied vocabulary, some complex sentences (because, although, which, if), accurate grammar (tenses, subject–verb agreement, articles), correct capitalisation and punctuation, a formal register.",
    "You receive the task's rubric (what each level looks like for THIS task) and three reference essays with their levels. Calibrate to them: an essay like the mid reference is mid, not high.",
    "Rules: an answer that does not answer the question is low on content. Count only what is on the page; never reward length by itself.",
    "Feedback is written for the learner in Hebrew, concrete and short, quoting the learner's English words inside the Hebrew where useful (quotes stay in English). No praise padding. workedHe: exactly 3 items that are true of this essay. fixHe: exactly 3 items, the most valuable fixes first, each naming the exact words to change. upgradedSentence: one real sentence from the essay rewritten at a higher level with the reason in Hebrew.",
    "flaggedErrors: among the common Hebrew-speaker errors listed, include only those that actually occur in the essay; `found` is the learner's exact wording, `write` the corrected wording, `noteHe` the rule. Empty array when none.",
    "Return only the JSON object.",
  ].join("\n");
}

function userPrompt(task: WritingTaskPublic, essay: string): string {
  const guide = getWritingGuide();
  const refs = task.samples
    .map((s) => `REFERENCE (${s.level}, ${s.statedWords} words):\n${s.essay}`)
    .join("\n\n");
  const errors = guide.commonErrors.map((e) => `- "${e.insteadOf}" → "${e.write}" (${e.noteHe})`).join("\n");
  return [
    `TASK PROMPT:\n${task.prompt}`,
    `RUBRIC, content and organization:\n- low: ${task.rubric.content.low}\n- mid: ${task.rubric.content.mid}\n- high: ${task.rubric.content.high}`,
    `RUBRIC, language range and accuracy:\n- low: ${task.rubric.language.low}\n- mid: ${task.rubric.language.mid}\n- high: ${task.rubric.language.high}`,
    refs,
    `COMMON HEBREW-SPEAKER ERRORS TO CHECK:\n${errors}`,
    `SUBMISSION (${countWords(essay)} words):\n${essay}`,
  ].join("\n\n");
}

const lower = (a: WritingLevel, b: WritingLevel): WritingLevel => {
  const order: WritingLevel[] = ["low", "mid", "high"];
  return order[Math.min(order.indexOf(a), order.indexOf(b))];
};

/** The info sheet's hard rules, applied after the model so they cannot be argued away. */
export function applyHardRules(
  task: WritingTaskPublic,
  essay: string,
  verdict: z.infer<typeof GradeSchema>,
): Omit<WritingGradeResult, "model" | "gradedAt"> {
  const wordCount = countWords(essay);
  const [min] = task.wordRange;
  const tooShort = wordCount < min;
  const tooLong = wordCount > 150;
  let content = verdict.content.level;
  let contentWhy = verdict.content.whyHe;
  if (!verdict.onTopic) {
    content = "low";
    contentWhy = `התשובה לא עונה על השאלה שנשאלה, ולכן ממד התוכן מקבל רמה נמוכה. ${verdict.content.whyHe}`.trim();
  } else if (tooShort) {
    content = lower(content, "low");
    contentWhy = `${wordCount} מילים: מתחת ל-${min}, ולכן ממד התוכן מקבל רמה נמוכה, כמו במבחן. ${verdict.content.whyHe}`.trim();
  }
  return {
    wordCount,
    onTopic: verdict.onTopic,
    tooShort,
    tooLong,
    content: { level: content, whyHe: contentWhy },
    language: { level: verdict.language.level, whyHe: verdict.language.whyHe },
    workedHe: verdict.workedHe.slice(0, 3),
    fixHe: verdict.fixHe.slice(0, 3),
    upgradedSentence: verdict.upgradedSentence,
    flaggedErrors: verdict.flaggedErrors.slice(0, 8),
  };
}

export async function gradeEssay(task: WritingTaskPublic, rawEssay: string): Promise<WritingGradeResult> {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY is missing");
  const essay = redactPersonalData(rawEssay).trim();
  const openai = new OpenAI({ apiKey: key, timeout: TIMEOUT_MS, maxRetries: 1 });
  const system = systemPrompt();
  const user = userPrompt(task, essay);
  const started = Date.now();
  logAiRequest({ operation: "writing_grade", provider: "openai", promptChars: system.length + user.length });
  try {
    const completion = await openai.chat.completions.parse({
      model: WRITING_MODEL,
      temperature: 0,
      max_completion_tokens: 1400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: zodResponseFormat(GradeSchema, "writing_grade"),
    });
    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) throw new Error("Empty parsed output");
    const model = completion.model ?? WRITING_MODEL;
    logAiResponse({
      operation: "writing_grade",
      provider: "openai",
      model,
      durationMs: Date.now() - started,
      outputChars: JSON.stringify(parsed).length,
    });
    return { ...applyHardRules(task, essay, parsed), model, gradedAt: new Date().toISOString() };
  } catch (e) {
    logAiError({ operation: "writing_grade", durationMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export { LEVEL_HE as WRITING_LEVEL_LABEL_HE };
