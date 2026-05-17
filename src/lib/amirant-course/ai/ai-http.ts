export function getAiRequestMeta(req: Request): { requestIp: string; sessionId?: string } {
  const requestIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "unknown";
  const raw = req.headers.get("x-prep-session-id")?.trim();
  return { requestIp, sessionId: raw || undefined };
}
