import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  })
  .parse(process.env);

const client = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

async function main() {
  const { count: chunkCount, error: countErr } = await client
    .from("course_content_chunks")
    .select("*", { count: "exact", head: true })
    .eq("course_slug", "amirant-preparation");
  if (countErr) throw countErr;

  const { count: embeddingCount, error: embErr } = await client
    .from("course_content_chunks")
    .select("*", { count: "exact", head: true })
    .eq("course_slug", "amirant-preparation")
    .not("embedding", "is", null);
  if (embErr) throw embErr;

  let rpcOk = false;
  let rpcRows = 0;
  if ((embeddingCount ?? 0) > 0) {
    const { data, error } = await client.rpc("match_course_content_chunks", {
      query_embedding: Array(1536).fill(0),
      match_count: 3,
      filter_course_slug: "amirant-preparation",
      filter_lesson_id: null,
      filter_topic: null,
    });
    if (!error) {
      rpcOk = true;
      rpcRows = Array.isArray(data) ? data.length : 0;
    }
  }

  const c = chunkCount ?? 0;
  const e = embeddingCount ?? 0;
  const healthy = c > 0 && e > 0 && rpcOk;
  let hint;
  if (!healthy) {
    if (c === 0) {
      hint =
        "No rows for course_slug=amirant-preparation. Run `npm run embeddings:amirant-sync` (requires OPENAI_API_KEY in .env).";
    } else if (e === 0) {
      hint = "Chunks exist but none have embeddings. Re-run `npm run embeddings:amirant-sync`.";
    } else if (!rpcOk) {
      hint = "Embeddings exist but vector RPC failed. Check `match_course_content_chunks` and pgvector extension.";
    }
  }

  const out = {
    chunkCount: c,
    embeddingCount: e,
    embeddingCoveragePct:
      c > 0 ? Number((((e / c) * 100).toFixed(2))) : 0,
    vectorRpc: {
      available: rpcOk,
      sampleRows: rpcRows,
    },
    status: healthy ? "healthy" : "degraded",
    ...(hint ? { hint } : {}),
  };

  console.log(JSON.stringify(out, null, 2));
  if (out.status !== "healthy") process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
