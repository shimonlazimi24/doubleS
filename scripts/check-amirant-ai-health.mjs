/**
 * Local AI + RAG health: env flags + optional full DB/vector when SUPABASE_SERVICE_ROLE_KEY is set.
 * Tries HTTP first if `AI_HEALTH_URL` or `NEXT_PUBLIC_APP_URL` is set; on connection failure, falls back to this script (no server required).
 */
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const baseUrl = (process.env.AI_HEALTH_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

if (baseUrl) {
  const u = new URL("/api/prep/amirant-course/ai/health", baseUrl);
  try {
    const res = await fetch(u, { method: "GET" });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(text);
    }
    if (!res.ok) process.exit(1);
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      JSON.stringify(
        {
          source: "fetch_failed",
          url: u.href,
          message: msg,
          hint: "Start `npm run dev` or unset NEXT_PUBLIC_APP_URL / AI_HEALTH_URL to run env+DB checks without HTTP.",
        },
        null,
        2,
      ),
    );
    console.error("Falling back to local env + database checks…\n");
  }
}

// Inline env check (no HTTP server required)
const openai = Boolean((process.env.OPENAI_API_KEY || "").trim());
const gemini = Boolean((process.env.GEMINI_API_KEY || "").trim());
const provider =
  (process.env.AI_PROVIDER || "openai").toLowerCase().trim() === "gemini" ? "gemini" : "openai";
const out = {
  source: "env+db (or `npm run dev` + set NEXT_PUBLIC_APP_URL to hit the API route instead)",
  config: {
    selectedProvider: provider,
    hasOpenAiKey: openai,
    hasGeminiKey: gemini,
    openAiKeyConfigured: openai,
    geminiKeyConfigured: gemini,
    chatModelOpenAi: process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini",
    chatModelGemini: process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-1.5-pro",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
  },
};

if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  console.log(
    JSON.stringify(
      { ...out, database: { note: "Set SUPABASE_SERVICE_ROLE_KEY (and URL) for RAG chunk counts" } },
      null,
      2,
    ),
  );
  process.exit(0);
}

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  })
  .parse(process.env);

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { count: chunkCount, error: cErr } = await client
  .from("course_content_chunks")
  .select("*", { count: "exact", head: true })
  .eq("course_slug", "amirant-preparation");
if (cErr) {
  console.error(cErr);
  process.exit(1);
}

const { count: embeddingCount, error: eErr } = await client
  .from("course_content_chunks")
  .select("*", { count: "exact", head: true })
  .eq("course_slug", "amirant-preparation")
  .not("embedding", "is", null);
if (eErr) {
  console.error(eErr);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ...out,
      database: {
        courseContentChunksTableReadable: true,
        chunkCount: chunkCount ?? 0,
        embeddingCount: embeddingCount ?? 0,
      },
    },
    null,
    2,
  ),
);
