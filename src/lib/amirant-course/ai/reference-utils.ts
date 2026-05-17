import type { RetrievedChunk } from "./retrieval";

type AiRef = { chunkId?: string; lessonId?: string; topic?: string };
type StrictAiRef = { chunkId: string; lessonId?: string; topic?: string };

export function normalizeChunkReferences(
  refs: AiRef[] | undefined,
  chunks: RetrievedChunk[],
): StrictAiRef[] {
  const allowed = new Map(
    chunks.map((chunk) => [
      chunk.id,
      { chunkId: chunk.id, lessonId: chunk.lessonId, topic: chunk.topic },
    ]),
  );
  const normalized: StrictAiRef[] = [];

  for (const ref of refs ?? []) {
    if (!ref.chunkId) continue;
    const hit = allowed.get(ref.chunkId);
    if (!hit) continue;
    normalized.push(hit);
  }

  if (normalized.length > 0) return normalized;
  return chunks.slice(0, Math.min(3, chunks.length)).map((chunk) => ({
    chunkId: chunk.id,
    lessonId: chunk.lessonId,
    topic: chunk.topic,
  }));
}
