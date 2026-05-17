import { z } from "zod";
import { runStructuredAi } from "./create-ai-client";
import { amirantRagSystemPrompt } from "./prompts";
import {
  aiAnalysisRequestSchema,
  buildDeterministicAnalysisText,
  type AiAnalysisRequest,
} from "./contract";
import { validateAiGroundedNumericClaims } from "./safety";
import { getOpenAiApiKey } from "./openai-client";

const aiAnalysisLlmResponseSchema = z.object({
  text: z.string().min(1),
});

const ANALYSIS_SYSTEM = [
  amirantRagSystemPrompt("coach_summary"),
  "You write a short Hebrew study analysis for Amirant prep.",
  "Use ONLY numbers and topic names present in the user JSON.",
  "Do not invent scores, percentages, or exam results.",
  "If data is sparse, say so and give general study steps.",
].join("\n");

export type AiAnalysisResult = {
  text: string;
  source: "openai" | "deterministic";
  model: string;
};

export async function runAiAnalysis(raw: unknown): Promise<AiAnalysisResult> {
  const body = aiAnalysisRequestSchema.parse(raw) as AiAnalysisRequest;
  const s = body.stats ?? {};
  const lessonLines = (body.lessonSnippets ?? []).map(
    (l) => `- [${l.moduleTitle}] ${l.title}: ${l.snippet || "(אין קטע טקסט)"}`,
  );
  const deterministic = buildDeterministicAnalysisText({
    weakTopics: s.weakTopics ?? [],
    strongTopics: s.strongTopics ?? [],
    byTopic: s.byTopic ?? {},
    improvementHint: s.improvementHint ?? "",
    lessonLines,
  });

  if (!getOpenAiApiKey()) {
    return { text: deterministic, source: "deterministic", model: "none" };
  }

  const payload = {
    kind: body.kind ?? "progress",
    stats: s,
    lessonSnippets: body.lessonSnippets ?? [],
  };

  try {
    const ai = await runStructuredAi({
      operation: "ai_analysis",
      schema: aiAnalysisLlmResponseSchema,
      schemaName: "amirant_ai_analysis",
      systemPrompt: ANALYSIS_SYSTEM,
      userPrompt: `Analyze this learner snapshot (JSON). Reply in Hebrew.\n\n${JSON.stringify(payload)}`,
      skipCache: true,
    });
    const safety = validateAiGroundedNumericClaims({
      texts: [ai.output.text],
      allowedSnapshots: [payload],
    });
    if (!safety.ok) {
      return { text: deterministic, source: "deterministic", model: "safety-fallback" };
    }
    return { text: ai.output.text.trim(), source: "openai", model: ai.model };
  } catch {
    return { text: deterministic, source: "deterministic", model: "none" };
  }
}
