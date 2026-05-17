import { describe, expect, it } from "vitest";
import { normalizeChunkReferences } from "./reference-utils";

describe("normalizeChunkReferences", () => {
  const chunks = [
    { id: "c1", lessonId: "l1", topic: "vocabulary", text: "t1" },
    { id: "c2", lessonId: "l2", topic: "rephrasing", text: "t2" },
  ];

  it("keeps only references that exist in retrieved chunks", () => {
    const refs = normalizeChunkReferences(
      [{ chunkId: "c2" }, { chunkId: "missing" }],
      chunks,
    );
    expect(refs).toEqual([{ chunkId: "c2", lessonId: "l2", topic: "rephrasing" }]);
  });

  it("falls back to top chunk IDs when model returns none", () => {
    const refs = normalizeChunkReferences([], chunks);
    expect(refs[0]?.chunkId).toBe("c1");
  });
});
