import { estimateAiCost } from "./ai-cost";

function operationToEndpoint(operation: string): string {
  return `/api/prep/amirant-course/ai/${operation.replace(/_/g, "-")}`;
}

export function logAiUsage(params: {
  event: "ai_usage";
  operation: string;
  /** Public API path for the feature (derived from `operation`). */
  endpoint: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  userId?: string;
  sessionId?: string;
  requestIp?: string;
  cacheHit?: boolean;
}): void {
  const line = JSON.stringify({ t: new Date().toISOString(), ...params });
  // eslint-disable-next-line no-console -- server-side usage / cost monitoring
  console.info(line);
}

export function buildUsagePayload(params: {
  operation: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  userId?: string;
  sessionId?: string;
  requestIp?: string;
  cacheHit?: boolean;
}) {
  const estimatedCostUsd = estimateAiCost({
    provider: params.provider,
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
  });
  return {
    ...params,
    estimatedCostUsd,
    endpoint: operationToEndpoint(params.operation),
  };
}

export function logAiSafetyValidationFailure(params: {
  operation: string;
  userId?: string;
  violations: string[];
}): void {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    event: "ai_safety_validation_failed",
    ...params,
  });
  // eslint-disable-next-line no-console
  console.warn(line);
}
