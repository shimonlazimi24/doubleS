/**
 * Server-side token guards (estimates, not hard API caps).
 * OpenAI / Gemini also enforce their own limits.
 */
export function getMaxOutputTokens(): number {
  const n = Number(process.env.AI_MAX_OUTPUT_TOKENS);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 8192) : 2048;
}

export function getMaxEstimatedInputTokens(): number {
  const n = Number(process.env.AI_MAX_ESTIMATED_INPUT_TOKENS);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 100_000) : 12_000;
}
