function safeJsonLine(payload: Record<string, unknown>): void {
  const line = JSON.stringify({ t: new Date().toISOString(), ...payload });
  if (payload.error || payload.event === "ai_error") {
    // eslint-disable-next-line no-console -- server-side structured AI diagnostics
    console.error(line);
  } else {
    // eslint-disable-next-line no-console -- server-side structured AI diagnostics
    console.info(line);
  }
}

export function logAiRequest(params: {
  operation: string;
  provider: string;
  promptChars: number;
}): void {
  safeJsonLine({ event: "ai_request", ...params, durationMs: 0 });
}

export function logAiResponse(params: {
  operation: string;
  provider: string;
  model: string;
  durationMs: number;
  outputChars: number;
}): void {
  safeJsonLine({ event: "ai_response", ...params });
}

export function logAiError(params: { operation: string; durationMs: number; error: string }): void {
  safeJsonLine({ event: "ai_error", ...params });
}

export function logAiFailover(params: { operation: string; from: string; to: string; message: string }): void {
  safeJsonLine({
    event: "ai_failover",
    operation: params.operation,
    durationMs: 0,
    message: params.message,
    error: `failover:${params.from}->${params.to}`,
  });
}
