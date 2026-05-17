/**
 * Rough per-1M-token prices (USD) for monitoring; not for billing.
 * Tweak when provider pricing changes.
 */
const RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "text-embedding-3-large": { input: 0.13, output: 0 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-1.5-pro-latest": { input: 1.25, output: 5 },
};

function normalizeModel(model: string): string {
  return model.trim();
}

/**
 * @returns Estimated cost in USD (0 if model unknown; still safe to log).
 */
export function estimateAiCost(params: {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const m = normalizeModel(params.model);
  let rates = RATES[m];
  if (!rates) {
    if (m.includes("gpt-4o-mini") || m.includes("gpt-4.1") || m.includes("gpt-4o")) {
      rates = RATES["gpt-4o-mini"];
    }
    else if (m.includes("gemini") || m.includes("models/gemini")) {
      rates = RATES["gemini-1.5-pro"];
    } else {
      rates = params.provider === "openai" ? RATES["gpt-4o-mini"] : RATES["gemini-1.5-pro"];
    }
  }
  if (!rates) return 0;
  return (params.inputTokens / 1_000_000) * rates.input + (params.outputTokens / 1_000_000) * rates.output;
}

export function estimateEmbeddingsCost(params: { model: string; inputTokens: number }): number {
  const m = normalizeModel(params.model);
  const rates = RATES[m] ?? RATES["text-embedding-3-small"]!;
  return (params.inputTokens / 1_000_000) * rates.input;
}

/** Heuristic: ~4 chars per token (mixed EN/HE). */
export function estimateTokenCountFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
